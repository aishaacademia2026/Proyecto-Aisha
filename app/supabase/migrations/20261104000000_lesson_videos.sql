-- Aisha: videos de clase guardados en el bucket privado "course-files".
--
-- Requiere 20261102000000_access_module.sql y 20261103000000_student_portal.sql.
-- Es ADITIVA: agrega columnas y funciones nuevas, reemplaza (create or replace) open_lesson y la politica
-- de lectura de Storage, y no borra ni modifica datos. Se puede ejecutar mas de una vez.
--
-- Como se publica un video (el mismo procedimiento sirve para todos los cursos):
--   1. Subir el archivo al bucket "course-files" con la ruta  <slug-del-curso>/<archivo>.mp4
--      (Supabase -> Storage -> course-files). El bucket es privado.
--   2. Registrar la clase con public.register_lesson_video(...). El script
--      app/scripts/lesson-video-sql.mjs genera esa llamada con los datos del archivo.
--   Solo quien tenga un permiso vigente sobre el curso (otorgado por el administrador) recibe el video.

-- ---------------------------------------------------------------------------
-- Datos del video en la leccion
-- ---------------------------------------------------------------------------

alter table public.course_lessons
  add column if not exists media_duration_seconds int check (media_duration_seconds is null or media_duration_seconds >= 0),
  add column if not exists media_size_bytes       bigint check (media_size_bytes is null or media_size_bytes >= 0),
  add column if not exists media_mime_type        text,
  add column if not exists media_width            int check (media_width is null or media_width > 0),
  add column if not exists media_height           int check (media_height is null or media_height > 0),
  add column if not exists media_original_name    text;

-- Una ruta de archivo no se registra dos veces dentro del mismo curso (evita clases duplicadas).
create unique index if not exists course_lessons_storage_path_key
  on public.course_lessons (storage_path) where storage_path is not null;

-- ---------------------------------------------------------------------------
-- Storage: la carpeta puede ser el id del curso o su slug (mas facil de crear a mano).
--   <slug-o-id-del-curso>/...   solo con acceso vigente (o administrador)
--   public/...                  cualquier usuario con sesion
--   certificates/<id-usuario>/  solo su titular (o administrador)
-- Las carpetas "public" y "certificates" estan reservadas: ningun curso puede usar esos slugs.
-- ---------------------------------------------------------------------------

drop policy if exists course_files_read on storage.objects;
create policy course_files_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'course-files'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = 'public'
      or ((storage.foldername(name))[1] = 'certificates'
          and (storage.foldername(name))[2] = (select auth.uid())::text)
      or case
           when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           then public.has_course_access(((storage.foldername(name))[1])::uuid)
           else exists (
             select 1 from public.courses c
             where c.slug = (storage.foldername(name))[1] and public.has_course_access(c.id)
           )
         end
    )
  );

-- ---------------------------------------------------------------------------
-- open_lesson: ahora tambien entrega los datos del video
-- ---------------------------------------------------------------------------

create or replace function public.open_lesson(p_lesson uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_l    record;
  v_has  boolean;
  v_rn   bigint;
  v_prev uuid;
  v_next uuid;
  v_st   text;
begin
  select l.id, l.title, l.content_type, l.body, l.media_url, l.storage_path, l.duration_minutes, l.is_required,
         l.media_duration_seconds, l.media_size_bytes, l.media_mime_type, l.media_width, l.media_height,
         m.id as module_id, m.title as module_title, m.course_id,
         c.title as course_title, c.slug as course_slug
    into v_l
  from public.course_lessons l
  join public.course_modules m on m.id = l.module_id
  join public.courses c on c.id = m.course_id
  where l.id = p_lesson;
  if not found then return null; end if;

  v_has := public.has_course_access(v_l.course_id);
  if not v_has and not public.is_admin() then return null; end if;

  if v_has then
    insert into public.lesson_progress (user_id, lesson_id, status)
    values (v_uid, p_lesson, 'in_progress')
    on conflict (user_id, lesson_id)
    do update set last_accessed_at = now();
  end if;

  with ordered as (
    select l2.id, row_number() over (order by m2.position, m2.created_at, m2.id, l2.position, l2.created_at, l2.id) as rn
    from public.course_lessons l2 join public.course_modules m2 on m2.id = l2.module_id
    where m2.course_id = v_l.course_id
  )
  select o.rn into v_rn from ordered o where o.id = p_lesson;

  with ordered as (
    select l2.id, row_number() over (order by m2.position, m2.created_at, m2.id, l2.position, l2.created_at, l2.id) as rn
    from public.course_lessons l2 join public.course_modules m2 on m2.id = l2.module_id
    where m2.course_id = v_l.course_id
  )
  select (select o.id from ordered o where o.rn = v_rn - 1),
         (select o.id from ordered o where o.rn = v_rn + 1)
    into v_prev, v_next;

  select p.status into v_st from public.lesson_progress p where p.user_id = v_uid and p.lesson_id = p_lesson;

  return jsonb_build_object(
    'id', v_l.id, 'title', v_l.title, 'content_type', v_l.content_type, 'body', v_l.body,
    'media_url', v_l.media_url, 'storage_path', v_l.storage_path,
    'duration_minutes', v_l.duration_minutes, 'is_required', v_l.is_required,
    'media_duration_seconds', v_l.media_duration_seconds, 'media_size_bytes', v_l.media_size_bytes,
    'media_mime_type', v_l.media_mime_type, 'media_width', v_l.media_width, 'media_height', v_l.media_height,
    'module_id', v_l.module_id, 'module_title', v_l.module_title,
    'course_id', v_l.course_id, 'course_title', v_l.course_title, 'course_slug', v_l.course_slug,
    'status', coalesce(v_st, 'none'),
    'prev_lesson_id', v_prev, 'next_lesson_id', v_next,
    'preview', not v_has
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Registro de una clase en video. Reutilizable para todos los cursos.
--   * Exige que el archivo YA este subido a Storage (no se registran clases sin video).
--   * Es idempotente: registrar el mismo archivo dos veces actualiza la clase, no la duplica.
--   * Solo administradores (o el propietario de la base, desde el SQL Editor).
-- ---------------------------------------------------------------------------

create or replace function public.register_lesson_video(
  p_course_slug       text,
  p_module_title      text,
  p_lesson_title      text,
  p_storage_path      text,
  p_duration_seconds  int,
  p_width             int default null,
  p_height            int default null,
  p_size_bytes        bigint default null,
  p_mime_type         text default 'video/mp4',
  p_original_name     text default null,
  p_description       text default null,
  p_is_required       boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course   uuid;
  v_module   uuid;
  v_lesson   uuid;
  v_existing uuid;
  v_pos      int;
  v_created  boolean := false;
begin
  -- auth.uid() es nulo para el propietario de la base (SQL Editor); la API siempre trae un usuario.
  if (select auth.uid()) is not null and not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if btrim(coalesce(p_lesson_title, '')) = '' or btrim(coalesce(p_storage_path, '')) = '' then
    raise exception 'La clase necesita un titulo y la ruta del archivo.' using errcode = '22023';
  end if;
  if p_duration_seconds is null or p_duration_seconds <= 0 then
    raise exception 'Indica la duracion del video en segundos.' using errcode = '22023';
  end if;
  if (storage.foldername(p_storage_path))[1] is distinct from p_course_slug then
    raise exception 'El archivo debe estar en la carpeta "%/" del bucket.', p_course_slug using errcode = '22023';
  end if;

  select c.id into v_course from public.courses c where c.slug = p_course_slug;
  if v_course is null then
    raise exception 'No existe un curso con el slug "%".', p_course_slug using errcode = 'P0002';
  end if;

  if not exists (select 1 from storage.objects o where o.bucket_id = 'course-files' and o.name = p_storage_path) then
    raise exception 'Primero sube el archivo "%" al bucket course-files.', p_storage_path using errcode = 'P0002';
  end if;

  -- modulo (por titulo, dentro del curso)
  select m.id into v_module from public.course_modules m
   where m.course_id = v_course and m.title = p_module_title order by m.position, m.created_at limit 1;
  if v_module is null then
    select coalesce(max(m.position), 0) + 1 into v_pos from public.course_modules m where m.course_id = v_course;
    insert into public.course_modules (course_id, title, position) values (v_course, p_module_title, v_pos)
    returning id into v_module;
  end if;

  select l.id into v_existing from public.course_lessons l where l.storage_path = p_storage_path;

  if v_existing is not null then
    update public.course_lessons
       set title = p_lesson_title, content_type = 'video', body = coalesce(p_description, body),
           duration_minutes = ceil(p_duration_seconds / 60.0)::int,
           media_duration_seconds = p_duration_seconds,
           -- un registro repetido sin estos datos conserva los que ya estaban
           media_size_bytes = coalesce(p_size_bytes, media_size_bytes),
           media_mime_type = coalesce(p_mime_type, media_mime_type),
           media_width = coalesce(p_width, media_width), media_height = coalesce(p_height, media_height),
           media_original_name = coalesce(p_original_name, media_original_name), is_required = p_is_required
     where id = v_existing
    returning id into v_lesson;
  else
    select coalesce(max(l.position), 0) + 1 into v_pos from public.course_lessons l where l.module_id = v_module;
    insert into public.course_lessons (
      module_id, title, content_type, body, storage_path, duration_minutes, position, is_required,
      media_duration_seconds, media_size_bytes, media_mime_type, media_width, media_height, media_original_name
    ) values (
      v_module, p_lesson_title, 'video', p_description, p_storage_path, ceil(p_duration_seconds / 60.0)::int, v_pos, p_is_required,
      p_duration_seconds, p_size_bytes, p_mime_type, p_width, p_height, p_original_name
    ) returning id into v_lesson;
    v_created := true;
  end if;

  return jsonb_build_object('lesson_id', v_lesson, 'module_id', v_module, 'course_id', v_course, 'created', v_created);
end;
$$;

revoke execute on function public.register_lesson_video(text, text, text, text, int, int, int, bigint, text, text, text, boolean)
  from public, anon;
grant execute on function public.register_lesson_video(text, text, text, text, int, int, int, bigint, text, text, text, boolean)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Primera clase de prueba: "Conociendo mi sensibilidad", clase 1.
-- Solo se registra si el archivo ya esta en Storage; si no, avisa y no hace nada.
--   Archivo:  course-files / conociendo-mi-sensibilidad / clase-1.mp4
-- Datos medidos del archivo original (WhatsApp Video 2026-11-04 at 10.59.02 AM.mp4):
--   69.7 s, 480x854 (vertical), H.264 + AAC, 8 016 784 bytes.
-- Despues puedes cambiar el titulo del modulo y de la clase en Table Editor (course_modules / course_lessons).
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from public.courses where slug = 'conociendo-mi-sensibilidad') then
    raise notice 'Se omite la clase 1: no existe el curso "conociendo-mi-sensibilidad".';
  elsif not exists (select 1 from storage.objects where bucket_id = 'course-files' and name = 'conociendo-mi-sensibilidad/clase-1.mp4') then
    raise notice 'Se omite la clase 1: sube primero conociendo-mi-sensibilidad/clase-1.mp4 al bucket course-files y vuelve a ejecutar esta migracion.';
  else
    perform public.register_lesson_video(
      'conociendo-mi-sensibilidad', 'Módulo 1', 'Clase 1', 'conociendo-mi-sensibilidad/clase-1.mp4',
      70, 480, 854, 8016784, 'video/mp4', 'WhatsApp Video 2026-11-04 at 10.59.02 AM.mp4'
    );
    raise notice 'Clase 1 registrada.';
  end if;
end;
$$;
