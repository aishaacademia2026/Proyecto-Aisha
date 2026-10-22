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
