# AISHA

Aplicación web en React y Vite para presentar cursos de la academia. La autenticación con Google se implementa con Supabase; la integración de pagos queda pendiente.

## Desarrollo local

1. Instala Node.js 20.19+ o 22.12+.
2. Desde esta carpeta ejecuta `npm install`.
3. Copia `.env.example` a `.env` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los datos del proyecto Supabase.
4. Ejecuta `npm run dev`.

Sin credenciales, la página funciona en modo demostración y muestra un aviso al intentar iniciar sesión.

## Activar acceso con Google en Supabase

1. En el panel de Supabase, configura Google como proveedor de autenticación y añade las credenciales OAuth que entrega Google Cloud.
2. En Authentication → URL Configuration, añade la URL local (`http://localhost:5173`) a las URL de redirección permitidas. Añade también la URL del sitio al publicarlo.
3. Copia la URL del proyecto y la clave publicable (anon) de Supabase en el archivo `.env`. No pongas claves `service_role` en la aplicación web ni subas `.env` a GitHub.
4. Reinicia el servidor de desarrollo después de modificar `.env`.

El catálogo de la primera versión es contenido de demostración dentro de la aplicación; aún no guarda cursos ni compras en una base de datos y no procesa pagos.

## Módulo de accesos a cursos y talleres

Los estudiantes inician sesión con Google; el administrador decide a qué cursos y talleres puede entrar cada persona. Los permisos son individuales: retirar el acceso a una persona no afecta a nadie más ni al catálogo.

**Activarlo (una sola vez)**
1. En Supabase abre **SQL Editor**, pega el contenido de `supabase/migrations/20261102000000_access_module.sql` y ejecútalo. Es una migración no destructiva: solo crea tablas, funciones y políticas nuevas. Incluye los tres cursos que hoy muestra la web.
2. Entra a la web con la cuenta de Google que será administradora (esto crea su perfil) y luego ejecuta en el SQL Editor, con su correo:
   `update public.profiles set role = 'admin' where email = 'correo-del-administrador@gmail.com';`
3. Esa cuenta verá **Panel de administración** en el menú de su nombre (también en `#admin/resumen`).

**Rutas:** `#mis-cursos` (estudiante), `#curso/<slug>` (contenido protegido) y `#admin/resumen | estudiantes | cursos | accesos | historial` (administración, con su propia barra lateral en lugar del menú del sitio).

**Seguridad:** el rol y los permisos se comprueban en la base de datos (RLS y funciones `SECURITY DEFINER`), no solo en la interfaz. Un estudiante no puede escribir en `course_access`, cambiar su rol ni leer la auditoría. Toda asignación o revocación queda en `access_audit_log`. No pongas la clave `service_role` en la aplicación.

**Nuevos cursos o talleres:** se agregan en Supabase (Table Editor → `courses`, con `content_type` = `course` o `workshop`). Un contenido en `draft` no es visible para estudiantes; uno `archived` no admite nuevas asignaciones.
