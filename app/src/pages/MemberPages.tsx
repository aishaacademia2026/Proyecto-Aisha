import { useEffect, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, GraduationCap, Lock } from "lucide-react";
import { getCourseForMember, getMyCourses, type MemberCourse } from "../lib/access";
import { LoadState, typeLabel, useLoad } from "./access-ui";

// Pages that need a signed-in visitor. The server still decides what each person may see.
export function AuthGate({
  ready,
  session,
  onSignIn,
  isSigningIn,
  title,
  children,
}: {
  ready: boolean;
  session: Session | null;
  onSignIn: () => void;
  isSigningIn: boolean;
  title: string;
  children: ReactNode;
}) {
  if (!ready) return <div className="member-page"><div className="member-wrap"><div className="state-box" role="status"><span className="spinner" aria-hidden="true" /> Cargando…</div></div></div>;
  if (!session) {
    return (
      <div className="member-page">
        <div className="member-wrap">
          <div className="gate-card">
            <Lock size={34} strokeWidth={1.4} aria-hidden="true" />
            <h1>{title}</h1>
            <p>Inicia sesión con tu cuenta de Google para continuar.</p>
            <button className="button" type="button" onClick={onSignIn} disabled={isSigningIn}>
              {isSigningIn ? "Conectando…" : "Iniciar sesión"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export function MyCoursesPage({ session }: { session: Session }) {
  const courses = useLoad(getMyCourses, []);

  // Reload when the visitor comes back to the tab, so a new assignment shows up without signing out.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") courses.reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  });

  const meta = session.user.user_metadata;
  const name = meta.full_name || meta.name || session.user.email;
  const avatar = meta.avatar_url || meta.picture;
  const items = courses.data ?? [];

  return (
    <div className="member-page">
      <div className="member-wrap">
        <header className="profile-card">
          {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <span className="profile-ph"><GraduationCap size={30} aria-hidden="true" /></span>}
          <div>
            <p className="eyebrow">Mi perfil</p>
            <h1>{name}</h1>
            <p>{session.user.email}</p>
          </div>
        </header>

        <h2 className="member-title">Mis cursos y talleres</h2>
        <LoadState loading={courses.loading} error={courses.error} onRetry={courses.reload} hasData={Boolean(courses.data)}>
          {items.length === 0 ? (
            <div className="empty-learning">
              <GraduationCap size={40} strokeWidth={1.2} aria-hidden="true" />
              <p>Tu espacio de aprendizaje está listo. Muy pronto encontrarás aquí los cursos y talleres que te acompañarán en tu camino.</p>
            </div>
          ) : (
            <div className="member-grid" aria-busy={courses.loading}>
              {items.map((course) => <MemberCard course={course} key={course.course_id} />)}
            </div>
          )}
        </LoadState>
      </div>
    </div>
  );
}

function MemberCard({ course }: { course: MemberCourse }) {
  const label = typeLabel(course.content_type);
  return (
    <article className="member-card">
      <div className="member-card-img">
        {course.cover_image ? <img src={course.cover_image} alt="" loading="lazy" /> : <span><GraduationCap size={36} aria-hidden="true" /></span>}
        <span className="level-tag">{label}</span>
      </div>
      <div className="member-card-body">
        <h3>{course.title}</h3>
        {course.description && <p>{course.description}</p>}
        <span className="badge badge-access-active">Acceso activo</span>
        <a className="button button-small" href={`#curso/${course.slug}`}>
          {course.content_type === "workshop" ? "Acceder al taller" : "Acceder al curso"} <ArrowRight size={14} />
        </a>
      </div>
    </article>
  );
}

export function CoursePage({ slug }: { slug: string }) {
  // The server only returns the course when this person has an active permission.
  const course = useLoad(() => getCourseForMember(slug), [slug]);
  const data = course.data;

  return (
    <div className="member-page">
      <div className="member-wrap">
        <LoadState loading={course.loading} error={course.error} onRetry={course.reload} hasData={course.data !== null || !course.loading}>
          {data ? (
            <article className="course-view">
              {data.cover_image && <img className="course-view-cover" src={data.cover_image} alt="" />}
              <p className="eyebrow">{typeLabel(data.content_type)}{data.category ? ` · ${data.category}` : ""}</p>
              <h1>{data.title}</h1>
              {data.access_status !== "active" && <p className="form-notice">Vista previa de administración: esta persona no tiene un acceso asignado.</p>}
              {data.description && <p className="course-view-lead">{data.description}</p>}
              <div className="course-view-soon">
                <p>El contenido de este {data.content_type === "workshop" ? "taller" : "curso"} se está preparando. Cuando esté listo, lo encontrarás aquí.</p>
              </div>
              <a className="button button-outline" href="#mis-cursos">Volver a mis cursos y talleres</a>
            </article>
          ) : (
            <div className="gate-card">
              <Lock size={34} strokeWidth={1.4} aria-hidden="true" />
              <h1>No tienes acceso a este contenido</h1>
              <p>Este contenido no está disponible para tu cuenta. Si crees que es un error, escríbenos y lo revisamos.</p>
              <div className="gate-actions">
                <a className="button" href="#mis-cursos">Ver mis cursos y talleres</a>
                <a className="button button-outline" href="#contacto">Contactar</a>
              </div>
            </div>
          )}
        </LoadState>
      </div>
    </div>
  );
}
