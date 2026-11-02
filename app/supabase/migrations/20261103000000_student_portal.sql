-- Aisha: portal del estudiante "Mi espacio Aisha".
--
-- Requiere la migracion 20261102000000_access_module.sql (profiles, courses, course_access, is_admin,
-- has_course_access). Esta migracion es ADITIVA: solo crea tablas, funciones y politicas nuevas.
-- No borra ni modifica datos existentes y se puede ejecutar mas de una vez.
--
-- Modelo
--   course_modules    modulos de un curso o taller
--   course_lessons    lecciones de un modulo (video, texto, pdf, audio, ejercicio, descarga)
--   lesson_progress   progreso INDIVIDUAL por leccion (se conserva aunque se revoque el acceso)
--   course_resources  recursos asociados a un curso, o marcados explicitamente como publicos
--   certificates      certificados realmente emitidos
--
-- Seguridad
--   * El contenido (modulos, lecciones, recursos) no se puede leer con consultas directas desde la web:
--     solo los administradores tienen politicas sobre esas tablas.
--   * Los estudiantes lo reciben unicamente a traves de funciones SECURITY DEFINER que comprueban en
--     el servidor que tengan un permiso vigente (la misma regla que el modulo de accesos).
--   * El progreso solo se escribe con set_lesson_completed()/open_lesson(), siempre sobre el usuario
--     autenticado y solo si tiene acceso vigente. Nadie puede tocar el progreso de otra persona.
--   * Archivos privados: bucket "course-files" no publico + politicas de Storage por curso.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.course_modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  title        text not null,
  description  text,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists course_modules_course_idx on public.course_modules (course_id, position);

create table if not exists public.course_lessons (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references public.course_modules (id) on delete cascade,
  title             text not null,
  content_type      text not null default 'text'
                    check (content_type in ('video', 'text', 'pdf', 'audio', 'exercise', 'download')),
  body              text,
  media_url         text,
  storage_path      text,
  duration_minutes  int check (duration_minutes is null or duration_minutes >= 0),
  position          int not null default 0,
  is_required       boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists course_lessons_module_idx on public.course_lessons (module_id, position);

create table if not exists public.lesson_progress (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  lesson_id         uuid not null references public.course_lessons (id) on delete cascade,
  status            text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  completed_at      timestamptz,
  last_accessed_at  timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint lesson_progress_user_lesson_key unique (user_id, lesson_id)
);
create index if not exists lesson_progress_user_idx on public.lesson_progress (user_id, status);

create table if not exists public.course_resources (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid references public.courses (id) on delete cascade,
  module_id     uuid references public.course_modules (id) on delete set null,
  lesson_id     uuid references public.course_lessons (id) on delete set null,
  title         text not null,
  description   text,
  kind          text not null default 'guide' check (kind in ('guide', 'meditation', 'exercise', 'video', 'other')),
  external_url  text,
  storage_path  text,
  is_public     boolean not null default false,
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint course_resources_target_check check (is_public or course_id is not null),
  constraint course_resources_file_check check (external_url is not null or storage_path is not null)
);
create index if not exists course_resources_course_idx on public.course_resources (course_id);

-- Copia del titulo y del nombre: el certificado sigue siendo legible aunque cambie el curso o el perfil.
create table if not exists public.certificates (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  course_id         uuid references public.courses (id) on delete set null,
  course_title      text not null,
  student_name      text not null,
  certificate_code  text unique,
  issued_at         timestamptz not null default now(),
  issued_by         uuid references public.profiles (id) on delete set null,
  storage_path      text,
  created_at        timestamptz not null default now()
);
create index if not exists certificates_user_idx on public.certificates (user_id, issued_at desc);

drop trigger if exists course_modules_set_updated_at on public.course_modules;
create trigger course_modules_set_updated_at before update on public.course_modules
  for each row execute function public.set_updated_at();
drop trigger if exists course_lessons_set_updated_at on public.course_lessons;
create trigger course_lessons_set_updated_at before update on public.course_lessons
  for each row execute function public.set_updated_at();
drop trigger if exists lesson_progress_set_updated_at on public.lesson_progress;
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();
drop trigger if exists course_resources_set_updated_at on public.course_resources;
create trigger course_resources_set_updated_at before update on public.course_resources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security y privilegios
-- ---------------------------------------------------------------------------

alter table public.course_modules    enable row level security;
alter table public.course_lessons    enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.course_resources  enable row level security;
alter table public.certificates      enable row level security;

revoke all on public.course_modules, public.course_lessons, public.lesson_progress,
              public.course_resources, public.certificates
  from anon, authenticated;

-- Contenido: solo administradores. Los estudiantes lo reciben por funciones (mas abajo).
grant select, insert, update, delete on public.course_modules, public.course_lessons, public.course_resources
  to authenticated;

drop policy if exists course_modules_admin on public.course_modules;
create policy course_modules_admin on public.course_modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists course_lessons_admin on public.course_lessons;
create policy course_lessons_admin on public.course_lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists course_resources_admin on public.course_resources;
create policy course_resources_admin on public.course_resources
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Progreso: cada persona lee el suyo; no hay politicas de escritura (solo las funciones escriben).
grant select on public.lesson_progress to authenticated;
drop policy if exists lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- Certificados: cada persona ve los suyos; solo administradores los emiten o editan.
grant select, insert, update, delete on public.certificates to authenticated;
drop policy if exists certificates_select on public.certificates;
create policy certificates_select on public.certificates
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists certificates_admin_write on public.certificates;
create policy certificates_admin_write on public.certificates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- (la politica "for all" tambien cubre select, pero la de lectura propia ya permite a la persona ver los suyos)

-- ---------------------------------------------------------------------------
-- Auxiliares internos (no se exponen a la API)
-- ---------------------------------------------------------------------------

create or replace function public._course_progress(p_user uuid, p_course uuid)
returns table (total int, completed int)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int,
         (count(*) filter (where p.status = 'completed'))::int
  from public.course_lessons l
  join public.course_modules m on m.id = l.module_id
  left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = p_user
  where m.course_id = p_course and l.is_required;
$$;

-- Leccion por la que seguir: la ultima visitada si no esta completada; si lo esta, la siguiente
-- pendiente; si no queda ninguna adelante, la primera pendiente; si todo esta completo, la primera.
create or replace function public._continue_lesson(p_user uuid, p_course uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with ordered as (
    select l.id,
           row_number() over (order by m.position, m.created_at, m.id, l.position, l.created_at, l.id) as rn,
           coalesce(p.status, 'none') as st,
           p.last_accessed_at
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
    left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = p_user
    where m.course_id = p_course
  ),
  last_seen as (
    select o.rn from ordered o where o.last_accessed_at is not null
    order by o.last_accessed_at desc, o.rn desc limit 1
  )
  select coalesce(
    (select o.id from ordered o where o.rn = (select rn from last_seen) and o.st <> 'completed'),
    (select o.id from ordered o where o.rn > (select rn from last_seen) and o.st <> 'completed' order by o.rn limit 1),
    (select o.id from ordered o where o.st <> 'completed' order by o.rn limit 1),
    (select o.id from ordered o order by o.rn limit 1)
  );
$$;

-- ---------------------------------------------------------------------------
-- Funciones del estudiante
-- ---------------------------------------------------------------------------

-- Cursos y talleres con permiso vigente (y publicados) con su avance. Es el unico listado de "Mis cursos".
create or replace function public.my_courses_progress()
returns table (
  course_id uuid, title text, slug text, description text, cover_image text, content_type text, category text,
  total_lessons int, completed_lessons int, progress_percent int, learning_status text,
  continue_lesson_id uuid, last_accessed_at timestamptz, granted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.title, c.slug, c.description, c.cover_image, c.content_type, c.category,
         pr.total, pr.completed,
         case when pr.total > 0 then round(100.0 * pr.completed / pr.total)::int end,
         case
           when pr.total > 0 and pr.completed = pr.total then 'completed'
           when exists (
             select 1 from public.lesson_progress lp
             join public.course_lessons l on l.id = lp.lesson_id
             join public.course_modules m on m.id = l.module_id
             where lp.user_id = a.user_id and m.course_id = c.id
           ) then 'in_progress'
           else 'not_started'
         end,
         public._continue_lesson(a.user_id, c.id),
         (select max(lp.last_accessed_at) from public.lesson_progress lp
            join public.course_lessons l on l.id = lp.lesson_id
            join public.course_modules m on m.id = l.module_id
            where lp.user_id = a.user_id and m.course_id = c.id),
         a.granted_at
  from public.course_access a
  join public.courses c on c.id = a.course_id
  cross join lateral public._course_progress(a.user_id, c.id) pr
  where a.user_id = (select auth.uid())
    and a.status = 'active'
    and c.publication_status = 'published'
  order by 13 desc nulls last, a.granted_at desc;
$$;

create or replace function public.my_dashboard()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (select * from public.my_courses_progress())
  select jsonb_build_object(
    'active_courses',        (select count(*) from mine where content_type = 'course'),
    'active_workshops',      (select count(*) from mine where content_type = 'workshop'),
    'workshops_in_progress', (select count(*) from mine where content_type = 'workshop' and learning_status = 'in_progress'),
    'started_courses',       (select count(*) from mine where content_type = 'course' and learning_status in ('in_progress', 'completed')),
    'completed_courses',     (select count(*) from mine where content_type = 'course' and learning_status = 'completed'),
    'completed_workshops',   (select count(*) from mine where content_type = 'workshop' and learning_status = 'completed'),
    'lessons_total',         (select coalesce(sum(total_lessons), 0) from mine),
    'lessons_completed',     (select coalesce(sum(completed_lessons), 0) from mine),
    'overall_percent',       (select case when sum(total_lessons) > 0
                                          then round(100.0 * sum(completed_lessons) / sum(total_lessons))::int end from mine),
    'certificates',          (select count(*) from public.certificates ce where ce.user_id = (select auth.uid()))
  );
$$;

-- Estructura de un curso para quien tiene acceso vigente (o un administrador, en vista previa).
-- Devuelve null si no hay acceso: el contenido privado no se entrega.
create or replace function public.get_course_outline(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_course  record;
  v_has     boolean;
  v_pr      record;
  v_modules jsonb;
begin
  select c.id, c.title, c.slug, c.description, c.cover_image, c.content_type, c.category
    into v_course
  from public.courses c where c.slug = p_slug;
  if not found then return null; end if;

  v_has := public.has_course_access(v_course.id);
  if not v_has and not public.is_admin() then return null; end if;

  select * into v_pr from public._course_progress(v_uid, v_course.id);

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', m.id, 'title', m.title, 'description', m.description, 'position', m.position,
      'lessons', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'id', l.id, 'title', l.title, 'content_type', l.content_type,
                 'duration_minutes', l.duration_minutes, 'is_required', l.is_required,
                 'status', coalesce(p.status, 'none')
               ) order by l.position, l.created_at, l.id), '[]'::jsonb)
        from public.course_lessons l
        left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = v_uid
        where l.module_id = m.id
      )
    ) order by m.position, m.created_at, m.id), '[]'::jsonb)
    into v_modules
  from public.course_modules m where m.course_id = v_course.id;

  return jsonb_build_object(
    'course', jsonb_build_object(
      'id', v_course.id, 'title', v_course.title, 'slug', v_course.slug, 'description', v_course.description,
      'cover_image', v_course.cover_image, 'content_type', v_course.content_type, 'category', v_course.category),
    'preview', not v_has,
    'modules', v_modules,
    'total_lessons', v_pr.total,
    'completed_lessons', v_pr.completed,
    'progress_percent', case when v_pr.total > 0 then round(100.0 * v_pr.completed / v_pr.total)::int end,
    'continue_lesson_id', public._continue_lesson(v_uid, v_course.id)
  );
end;
$$;

-- Abre una leccion: comprueba el acceso, registra la visita (reanudar) y devuelve su contenido.
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
    'module_id', v_l.module_id, 'module_title', v_l.module_title,
    'course_id', v_l.course_id, 'course_title', v_l.course_title, 'course_slug', v_l.course_slug,
    'status', coalesce(v_st, 'none'),
    'prev_lesson_id', v_prev, 'next_lesson_id', v_next,
    'preview', not v_has
  );
end;
$$;

-- Marca una leccion como completada (o la devuelve a "en progreso") y devuelve el avance del curso.
create or replace function public.set_lesson_completed(p_lesson uuid, p_completed boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_course uuid;
  v_pr     record;
begin
  select m.course_id into v_course
  from public.course_lessons l join public.course_modules m on m.id = l.module_id
  where l.id = p_lesson;

  if v_course is null or not public.has_course_access(v_course) then
    raise exception 'Tu acceso a este contenido no esta activo.' using errcode = 'P0002';
  end if;

  insert into public.lesson_progress (user_id, lesson_id, status, completed_at)
  values (v_uid, p_lesson, case when p_completed then 'completed' else 'in_progress' end,
          case when p_completed then now() end)
  on conflict (user_id, lesson_id)
  do update set status = excluded.status,
                completed_at = excluded.completed_at,
                last_accessed_at = now();

  select * into v_pr from public._course_progress(v_uid, v_course);
  return jsonb_build_object(
    'status', case when p_completed then 'completed' else 'in_progress' end,
    'total_lessons', v_pr.total,
    'completed_lessons', v_pr.completed,
    'progress_percent', case when v_pr.total > 0 then round(100.0 * v_pr.completed / v_pr.total)::int end
  );
end;
$$;

-- Recursos de cursos con acceso vigente, o marcados explicitamente como publicos.
create or replace function public.my_resources()
returns table (
  resource_id uuid, title text, description text, kind text, external_url text, storage_path text,
  is_public boolean, course_id uuid, course_title text, course_slug text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.title, r.description, r.kind, r.external_url, r.storage_path, r.is_public,
         c.id, c.title, c.slug
  from public.course_resources r
  left join public.courses c on c.id = r.course_id
  where r.is_public
     or (r.course_id is not null and public.has_course_access(r.course_id))
  order by r.kind, r.position, r.title;
$$;

create or replace function public.my_certificates()
returns table (
  certificate_id uuid, course_title text, student_name text, certificate_code text,
  issued_at timestamptz, storage_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select ce.id, ce.course_title, ce.student_name, ce.certificate_code, ce.issued_at, ce.storage_path
  from public.certificates ce
  where ce.user_id = (select auth.uid())
  order by ce.issued_at desc;
$$;

-- La persona solo puede cambiar su nombre; rol, correo y permisos quedan fuera de su alcance.
create or replace function public.update_my_name(p_full_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_full_name, ''));
begin
  if char_length(v_name) < 1 or char_length(v_name) > 120 then
    raise exception 'El nombre debe tener entre 1 y 120 caracteres.' using errcode = '22023';
  end if;
  update public.profiles set full_name = v_name where id = (select auth.uid());
  return v_name;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos de ejecucion
-- ---------------------------------------------------------------------------

revoke execute on function public._course_progress(uuid, uuid), public._continue_lesson(uuid, uuid)
  from public, anon, authenticated;

revoke execute on function
  public.my_courses_progress(), public.my_dashboard(), public.get_course_outline(text),
  public.open_lesson(uuid), public.set_lesson_completed(uuid, boolean), public.my_resources(),
  public.my_certificates(), public.update_my_name(text)
  from public, anon;

grant execute on function
  public.my_courses_progress(), public.my_dashboard(), public.get_course_outline(text),
  public.open_lesson(uuid), public.set_lesson_completed(uuid, boolean), public.my_resources(),
  public.my_certificates(), public.update_my_name(text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado. Las rutas siguen este esquema:
--   <id-del-curso>/...        archivos de un curso: solo quien tiene acceso vigente (o un administrador)
--   public/...                recursos marcados como publicos: cualquier usuario con sesion
--   certificates/<id-usuario>/...  certificados: solo su titular (o un administrador)
-- Subir, cambiar o borrar archivos: solo administradores.
-- La web pide URLs firmadas de pocos minutos; nunca hay enlaces publicos permanentes.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', false)
on conflict (id) do nothing;

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
           else false
         end
    )
  );

drop policy if exists course_files_admin_insert on storage.objects;
create policy course_files_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'course-files' and public.is_admin());

drop policy if exists course_files_admin_update on storage.objects;
create policy course_files_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'course-files' and public.is_admin())
  with check (bucket_id = 'course-files' and public.is_admin());

drop policy if exists course_files_admin_delete on storage.objects;
create policy course_files_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'course-files' and public.is_admin());
