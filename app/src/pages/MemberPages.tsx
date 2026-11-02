import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { GraduationCap, Lock } from "lucide-react";
import { getCourseForMember, getMyCourses, type MemberCourse } from "../lib/access";
import { AccessBadge, LoadState, formatDate, typeLabel, useLoad } from "./access-ui";
import { LotusIcon } from "./brand";

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

type ProfileTab = "courses" | "data";

export function MyCoursesPage({ session }: { session: Session }) {
  const courses = useLoad(getMyCourses, []);
  const [tab, setTab] = useState<ProfileTab>("courses");

  // Reload when the visitor comes back to the tab, so a new assignment shows up without signing out.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") courses.reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  });

  const meta = session.user.user_metadata;
  const name: string = meta.full_name || meta.name || session.user.email || "";
  const avatar: string | undefined = meta.avatar_url || meta.picture || undefined;
  const items = courses.data ?? [];
  const since = formatDate(session.user.created_at);
  const state = courses.data ? (items.length > 0 ? "active" : "none") : null;

  return (
    <div className="member-page member-page-profile">
      <div className="member-wrap member-wrap-profile">
        <header className="profile-head">
          {avatar ? (
            <img src={avatar} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="profile-ph"><GraduationCap size={34} aria-hidden="true" /></span>
          )}
          <div>
            <h1>{name}</h1>
            <p className="profile-mail">{session.user.email}</p>
            <p className="profile-meta">
              Miembro desde {since}
              {state && (<><span aria-hidden="true"> · </span>Estado: <AccessBadge status={state} /></>)}
            </p>
          </div>
        </header>

        <div className="profile-tabs" role="tablist" aria-label="Secciones de mi perfil">
          <button type="button" role="tab" id="tab-courses" aria-selected={tab === "courses"} aria-controls="panel-courses" className={tab === "courses" ? "active" : undefined} onClick={() => setTab("courses")}>
            Mis cursos y talleres
          </button>
          <button type="button" role="tab" id="tab-data" aria-selected={tab === "data"} aria-controls="panel-data" className={tab === "data" ? "active" : undefined} onClick={() => setTab("data")}>
            Mis datos
          </button>
        </div>

        {tab === "courses" ? (
          <section className="profile-panel" id="panel-courses" role="tabpanel" aria-labelledby="tab-courses">
            <h2>Mis cursos y talleres</h2>
            <p className="profile-lead">Aquí encontrarás los cursos y talleres a los que tienes acceso.</p>
            <LoadState loading={courses.loading} error={courses.error} onRetry={courses.reload} hasData={Boolean(courses.data)}>
              <div className="member-grid" aria-busy={courses.loading}>
                {items.map((course) => <MemberCard course={course} key={course.course_id} />)}
                <div className="empty-learning">
                  <span className="empty-learning-icon"><LotusIcon /></span>
                  <p><strong>Tu espacio de aprendizaje está listo.</strong> Muy pronto encontrarás aquí los cursos y talleres que te acompañarán en tu camino.</p>
                </div>
              </div>
            </LoadState>
          </section>
        ) : (
          <section className="profile-panel" id="panel-data" role="tabpanel" aria-labelledby="tab-data">
            <h2>Mis datos</h2>
            <p className="profile-lead">La información de tu cuenta. Se toma de tu cuenta de Google.</p>
            <dl className="profile-data">
              <div><dt>Nombre</dt><dd>{name || "—"}</dd></div>
              <div><dt>Correo electrónico</dt><dd>{session.user.email}</dd></div>
              <div><dt>Miembro desde</dt><dd>{since}</dd></div>
              <div><dt>Cursos y talleres con acceso</dt><dd>{courses.data ? items.length : "—"}</dd></div>
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}

function MemberCard({ course }: { course: MemberCourse }) {
  const workshop = course.content_type === "workshop";
  return (
    <article className="member-card">
      <div className="member-card-img">
        {course.cover_image ? <img src={course.cover_image} alt="" loading="lazy" /> : <span><GraduationCap size={36} aria-hidden="true" /></span>}
      </div>
      <div className="member-card-body">
        <h3>{course.title}</h3>
        <p className="member-card-meta">{typeLabel(course.content_type)}{course.category ? ` · ${course.category}` : ""}</p>
        <a className="member-card-btn" href={`#curso/${course.slug}`}>
          {workshop ? "Acceder al taller" : "Acceder al curso"}
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
