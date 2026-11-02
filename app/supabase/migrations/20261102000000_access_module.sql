-- Aisha: modulo de administracion de cursos, talleres y accesos de estudiantes.
--
-- Migracion NO destructiva: solo crea objetos nuevos (todos con "if not exists" o "or replace").
-- No borra ni modifica datos existentes. Pensada para ejecutarse una vez en el SQL Editor de Supabase.
--
-- Modelo
--   profiles          un perfil por usuario de auth.users (rol: student | admin)
--   courses           catalogo global de cursos y talleres (estado de publicacion global)
--   course_access     permiso INDIVIDUAL de un estudiante sobre un curso (active | revoked)
--   access_audit_log  historial inmutable de asignaciones y revocaciones
--
-- Seguridad
--   * RLS activado en las cuatro tablas.
--   * El estudiante solo lee su propio perfil y sus propios permisos; no puede escribir en course_access.
--   * Toda operacion administrativa pasa por funciones SECURITY DEFINER (search_path vacio) que
--     comprueban el rol de administrador en el servidor.
--   * El rol solo puede cambiarlo un administrador (o el propietario de la base desde el SQL Editor).

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.courses (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  slug                text not null unique,
  description         text,
  cover_image         text,
  content_type        text not null default 'course' check (content_type in ('course', 'workshop')),
  category            text,
  publication_status  text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.course_access (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  course_id   uuid not null references public.courses (id) on delete cascade,
  status      text not null default 'active' check (status in ('active', 'revoked')),
  granted_by  uuid references public.profiles (id) on delete set null,
  granted_at  timestamptz not null default now(),
  revoked_by  uuid references public.profiles (id) on delete set null,
  revoked_at  timestamptz,
  updated_at  timestamptz not null default now(),
  constraint course_access_user_course_key unique (user_id, course_id)
);

create index if not exists course_access_course_idx on public.course_access (course_id, status);
create index if not exists course_access_user_idx on public.course_access (user_id, status);

-- El historial conserva una copia del correo y del titulo para seguir siendo legible
-- aunque despues se borre el usuario o el curso.
create table if not exists public.access_audit_log (
  id               bigint generated always as identity primary key,
  user_id          uuid references public.profiles (id) on delete set null,
  course_id        uuid references public.courses (id) on delete set null,
  action           text not null check (action in ('grant', 'revoke', 'reactivate')),
  performed_by     uuid references public.profiles (id) on delete set null,
  performed_at     timestamptz not null default now(),
  previous_status  text,
  new_status       text not null,
  user_email       text,
  course_title     text
);

create index if not exists access_audit_log_performed_idx on public.access_audit_log (performed_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists course_access_set_updated_at on public.course_access;
create trigger course_access_set_updated_at before update on public.course_access
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Rol de administrador
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- Un estudiante solo puede cambiar su nombre: ni rol, ni correo, ni id.
-- auth.uid() es nulo cuando la sentencia la ejecuta el propietario (SQL Editor / service_role),
-- que es como se nombra al primer administrador.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'No puedes modificar tu rol.' using errcode = '42501';
    end if;
    if new.id is distinct from old.id or new.email is distinct from old.email then
      raise exception 'No puedes modificar estos datos del perfil.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------------
-- Alta automatica del perfil al registrarse
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfiles para los usuarios que ya existian antes de esta migracion.
insert into public.profiles (id, full_name, email)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), u.email
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Catalogo inicial: los tres cursos que hoy se muestran en la web.
-- ---------------------------------------------------------------------------

insert into public.courses (title, slug, description, cover_image, content_type, category, publication_status)
values
  ('Conociendo mi sensibilidad', 'conociendo-mi-sensibilidad',
   'Aprende a identificar tus señales, explora tu intuición y comienza tu camino.',
   '/course-sensibilidad.jpg', 'course', 'Sensibilidad', 'published'),
  ('Desarrollo de la percepción', 'desarrollo-de-la-percepcion',
   'Ejercicios prácticos para fortalecer tu intuición y ampliar tu percepción.',
   '/course-percepcion.jpg', 'course', 'Percepción', 'published'),
  ('Mediumnidad en la vida diaria', 'mediumnidad-en-la-vida-diaria',
   'Integra tus experiencias y aprende a mantener el equilibrio.',
   '/course-mediumnidad.jpg', 'course', 'Mediumnidad', 'published')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security y privilegios
-- ---------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.courses           enable row level security;
alter table public.course_access     enable row level security;
alter table public.access_audit_log  enable row level security;

revoke all on public.profiles, public.courses, public.course_access, public.access_audit_log
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.courses to anon, authenticated;
grant insert, update, delete on public.courses to authenticated;
grant select on public.course_access to authenticated;
-- access_audit_log no se concede a nadie: el administrador la lee con admin_list_audit().

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select to anon, authenticated
  using (publication_status = 'published' or public.is_admin());

drop policy if exists courses_admin_insert on public.courses;
create policy courses_admin_insert on public.courses
  for insert to authenticated with check (public.is_admin());

drop policy if exists courses_admin_update on public.courses;
create policy courses_admin_update on public.courses
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists courses_admin_delete on public.courses;
create policy courses_admin_delete on public.courses
  for delete to authenticated using (public.is_admin());

-- Sin politicas de escritura: course_access solo cambia a traves de public.admin_set_access().
drop policy if exists course_access_select on public.course_access;
create policy course_access_select on public.course_access
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists audit_select_admin on public.access_audit_log;
create policy audit_select_admin on public.access_audit_log
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Funciones del estudiante
-- ---------------------------------------------------------------------------

create or replace function public.my_profile()
returns table (id uuid, full_name text, email text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.email, p.role
  from public.profiles p
  where p.id = (select auth.uid());
$$;

-- Cursos y talleres con permiso vigente del usuario actual. Solo contenido publicado.
create or replace function public.my_courses()
returns table (
  course_id uuid, title text, slug text, description text, cover_image text,
  content_type text, category text, access_status text, granted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.title, c.slug, c.description, c.cover_image, c.content_type, c.category,
         a.status, a.granted_at
  from public.course_access a
  join public.courses c on c.id = a.course_id
  where a.user_id = (select auth.uid())
    and a.status = 'active'
    and c.publication_status = 'published'
  order by a.granted_at desc;
$$;

create or replace function public.has_course_access(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_access a
    join public.courses c on c.id = a.course_id
    where a.user_id = (select auth.uid())
      and a.course_id = p_course
      and a.status = 'active'
      and c.publication_status = 'published'
  );
$$;

-- Devuelve el curso solo si el usuario tiene permiso vigente (o es administrador).
-- Es el punto de control en el servidor para el contenido protegido.
create or replace function public.get_course_for_member(p_slug text)
returns table (
  course_id uuid, title text, slug text, description text, cover_image text,
  content_type text, category text, access_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.title, c.slug, c.description, c.cover_image, c.content_type, c.category,
         case when a.status = 'active' then 'active' else 'admin_preview' end
  from public.courses c
  left join public.course_access a on a.course_id = c.id and a.user_id = (select auth.uid())
  where c.slug = p_slug
    and (
      (a.status = 'active' and c.publication_status = 'published')
      or public.is_admin()
    );
$$;

-- ---------------------------------------------------------------------------
-- Funciones administrativas (todas exigen rol admin en el servidor)
-- ---------------------------------------------------------------------------

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'students',          (select count(*) from public.profiles p where p.role = 'student'),
    'published_courses', (select count(*) from public.courses c where c.content_type = 'course' and c.publication_status = 'published'),
    'published_workshops', (select count(*) from public.courses c where c.content_type = 'workshop' and c.publication_status = 'published'),
    'active_access',     (select count(*) from public.course_access a where a.status = 'active'),
    'revoked_access',    (select count(*) from public.course_access a where a.status = 'revoked')
  );
end;
$$;

create or replace function public.admin_list_students(
  p_search text default '', p_limit int default 10, p_offset int default 0
)
returns table (
  student_id uuid, full_name text, email text, created_at timestamptz,
  courses_count int, workshops_count int, total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pattern text := '%' || replace(replace(replace(coalesce(p_search, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  return query
  with filtered as (
    select p.id, p.full_name, p.email, p.created_at
    from public.profiles p
    where p.role = 'student'
      and (coalesce(p_search, '') = '' or p.full_name ilike v_pattern or p.email ilike v_pattern)
  )
  select f.id, f.full_name, f.email, f.created_at,
         (select count(*)::int from public.course_access a join public.courses c on c.id = a.course_id
           where a.user_id = f.id and a.status = 'active' and c.content_type = 'course'),
         (select count(*)::int from public.course_access a join public.courses c on c.id = a.course_id
           where a.user_id = f.id and a.status = 'active' and c.content_type = 'workshop'),
         count(*) over ()
  from filtered f
  order by f.created_at desc, f.id
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

create or replace function public.admin_list_courses(
  p_search text default '', p_type text default '', p_status text default '',
  p_limit int default 10, p_offset int default 0
)
returns table (
  course_id uuid, title text, slug text, cover_image text, content_type text, category text,
  publication_status text, active_students int, total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pattern text := '%' || replace(replace(replace(coalesce(p_search, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  return query
  select c.id, c.title, c.slug, c.cover_image, c.content_type, c.category, c.publication_status,
         (select count(*)::int from public.course_access a where a.course_id = c.id and a.status = 'active'),
         count(*) over ()
  from public.courses c
  where (coalesce(p_search, '') = '' or c.title ilike v_pattern)
    and (coalesce(p_type, '') = '' or c.content_type = p_type)
    and (coalesce(p_status, '') = '' or c.publication_status = p_status)
  order by c.created_at, c.title
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

-- Todos los contenidos con el estado de acceso de un estudiante concreto.
create or replace function public.admin_student_access(p_user uuid)
returns table (
  course_id uuid, title text, cover_image text, content_type text, category text,
  publication_status text, access_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  return query
  select c.id, c.title, c.cover_image, c.content_type, c.category, c.publication_status,
         coalesce(a.status, 'none')
  from public.courses c
  left join public.course_access a on a.course_id = c.id and a.user_id = p_user
  order by c.created_at, c.title;
end;
$$;

create or replace function public.admin_course_students(
  p_course uuid, p_limit int default 20, p_offset int default 0
)
returns table (
  student_id uuid, full_name text, email text, access_status text, granted_at timestamptz,
  revoked_at timestamptz, total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  return query
  select p.id, p.full_name, p.email, a.status, a.granted_at, a.revoked_at, count(*) over ()
  from public.course_access a
  join public.profiles p on p.id = a.user_id
  where a.course_id = p_course
  order by (a.status = 'active') desc, p.full_name nulls last, p.email
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

-- Otorga o revoca el acceso de UN estudiante a uno o varios cursos, en una sola transaccion
-- y dejando rastro en access_audit_log. Si algo falla, no se aplica nada.
create or replace function public.admin_set_access(p_user uuid, p_courses uuid[], p_grant boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin     uuid := (select auth.uid());
  v_email     text;
  v_course    record;
  v_prev      text;
  v_changed   int := 0;
  v_unchanged int := 0;
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if p_courses is null or coalesce(array_length(p_courses, 1), 0) = 0 then
    raise exception 'Selecciona al menos un curso o taller.' using errcode = '22023';
  end if;

  select p.email into v_email from public.profiles p where p.id = p_user;
  if not found then
    raise exception 'El estudiante no existe o no tiene un perfil valido.' using errcode = 'P0002';
  end if;

  -- Serializa operaciones simultaneas sobre el mismo estudiante.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  for v_course in
    select c.id, c.title, c.publication_status
    from public.courses c
    where c.id = any (p_courses)
    order by c.title
  loop
    select a.status into v_prev
    from public.course_access a
    where a.user_id = p_user and a.course_id = v_course.id
    for update;

    if p_grant then
      if v_course.publication_status = 'archived' then
        raise exception 'El contenido "%" esta archivado y no admite nuevas asignaciones.', v_course.title
          using errcode = '23514';
      end if;

      if v_prev is null then
        insert into public.course_access (user_id, course_id, status, granted_by)
        values (p_user, v_course.id, 'active', v_admin);
        insert into public.access_audit_log (user_id, course_id, action, performed_by, previous_status, new_status, user_email, course_title)
        values (p_user, v_course.id, 'grant', v_admin, null, 'active', v_email, v_course.title);
        v_changed := v_changed + 1;
      elsif v_prev = 'revoked' then
        update public.course_access
           set status = 'active', granted_by = v_admin, granted_at = now(), revoked_by = null, revoked_at = null
         where user_id = p_user and course_id = v_course.id;
        insert into public.access_audit_log (user_id, course_id, action, performed_by, previous_status, new_status, user_email, course_title)
        values (p_user, v_course.id, 'reactivate', v_admin, 'revoked', 'active', v_email, v_course.title);
        v_changed := v_changed + 1;
      else
        v_unchanged := v_unchanged + 1;
      end if;
    else
      if v_prev = 'active' then
        update public.course_access
           set status = 'revoked', revoked_by = v_admin, revoked_at = now()
         where user_id = p_user and course_id = v_course.id;
        insert into public.access_audit_log (user_id, course_id, action, performed_by, previous_status, new_status, user_email, course_title)
        values (p_user, v_course.id, 'revoke', v_admin, 'active', 'revoked', v_email, v_course.title);
        v_changed := v_changed + 1;
      else
        v_unchanged := v_unchanged + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object('changed', v_changed, 'unchanged', v_unchanged);
end;
$$;

create or replace function public.admin_list_audit(p_limit int default 20, p_offset int default 0)
returns table (
  log_id bigint, performed_at timestamptz, action text, previous_status text, new_status text,
  student_name text, student_email text, course_title text, admin_name text, total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  return query
  select l.id, l.performed_at, l.action, l.previous_status, l.new_status,
         sp.full_name, coalesce(l.user_email, sp.email), coalesce(l.course_title, c.title),
         coalesce(ap.full_name, ap.email), count(*) over ()
  from public.access_audit_log l
  left join public.profiles sp on sp.id = l.user_id
  left join public.courses c on c.id = l.course_id
  left join public.profiles ap on ap.id = l.performed_by
  order by l.performed_at desc, l.id desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos de ejecucion: solo usuarios autenticados (la comprobacion de rol va dentro).
-- ---------------------------------------------------------------------------

revoke execute on function
  public.is_admin(), public.my_profile(), public.my_courses(), public.has_course_access(uuid),
  public.get_course_for_member(text), public.admin_dashboard_stats(),
  public.admin_list_students(text, int, int), public.admin_list_courses(text, text, text, int, int),
  public.admin_student_access(uuid), public.admin_course_students(uuid, int, int),
  public.admin_set_access(uuid, uuid[], boolean), public.admin_list_audit(int, int)
  from public, anon;

grant execute on function
  public.is_admin(), public.my_profile(), public.my_courses(), public.has_course_access(uuid),
  public.get_course_for_member(text), public.admin_dashboard_stats(),
  public.admin_list_students(text, int, int), public.admin_list_courses(text, text, text, int, int),
  public.admin_student_access(uuid), public.admin_course_students(uuid, int, int),
  public.admin_set_access(uuid, uuid[], boolean), public.admin_list_audit(int, int)
  to authenticated;

-- is_admin() tambien se evalua dentro de la politica de lectura publica del catalogo.
grant execute on function public.is_admin() to anon;

-- ---------------------------------------------------------------------------
-- DESPUES de ejecutar esta migracion, nombra al primer administrador (una sola vez,
-- sustituyendo el correo por el de la cuenta de Google que usara el administrador,
-- que debe haber iniciado sesion al menos una vez en la web):
--
--   update public.profiles set role = 'admin' where email = 'correo-del-administrador@gmail.com';
-- ---------------------------------------------------------------------------
