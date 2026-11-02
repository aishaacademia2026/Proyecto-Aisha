import { Award, BookOpen, Flower2, TrendingUp } from "lucide-react";
import { getPortalCourses, getPortalDashboard } from "../lib/portal";
import { LoadState, useLoad } from "../pages/access-ui";
import { CourseCard, EmptyLearning } from "./ui";

export function Dashboard({ firstName }: { firstName: string | null }) {
  const dash = useLoad(getPortalDashboard, []);
  const courses = useLoad(getPortalCourses, []);
  const d = dash.data;
  const list = courses.data ?? [];
  const featured = [...list].sort((a, b) => Number(b.learning_status === "in_progress") - Number(a.learning_status === "in_progress")).slice(0, 3);

  const cards = [
    { icon: BookOpen, label: "Cursos activos", value: d ? String(d.active_courses) : "—", hint: d && d.completed_courses > 0 ? `${d.completed_courses} completado${d.completed_courses === 1 ? "" : "s"}` : "Con acceso vigente", tone: "orange" },
    { icon: Flower2, label: "Talleres en progreso", value: d ? String(d.workshops_in_progress) : "—", hint: d ? `${d.active_workshops} taller${d.active_workshops === 1 ? "" : "es"} con acceso` : "", tone: "rose" },
    { icon: TrendingUp, label: "Mi progreso", value: d && d.overall_percent !== null ? `${d.overall_percent}%` : "—", hint: d && d.overall_percent === null ? "Aún sin lecciones que medir" : d ? `${d.lessons_completed} de ${d.lessons_total} lecciones` : "", tone: "green" },
    { icon: Award, label: "Certificados", value: d ? String(d.certificates) : "—", hint: d && d.certificates === 0 ? "Aún no has recibido ninguno" : "Emitidos por la academia", tone: "amber" },
  ];

  return (
    <>
      <section className="portal-banner" aria-labelledby="portal-welcome">
        <img src="/portal-banner.jpg" alt="" />
        <div className="portal-banner-copy">
          <p className="eyebrow">Mi espacio Aisha</p>
          <h1 id="portal-welcome">{firstName ? `Mi espacio, ${firstName}` : "Mi espacio"}</h1>
          <p className="portal-banner-lead">Bienvenida a tu espacio de aprendizaje.</p>
          <p>Aquí encontrarás los cursos, talleres y recursos que te acompañan en tu camino de expansión y conexión.</p>
        </div>
      </section>

      <LoadState loading={dash.loading} error={dash.error} onRetry={dash.reload} hasData={Boolean(dash.data)}>
        <div className="portal-stats">
          {cards.map(({ icon: Icon, label, value, hint, tone }) => (
            <article className="portal-stat" key={label}>
              <span className={`stat-icon tone-${tone}`}><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span>
              <div>
                <span className="stat-label">{label}</span>
                <strong>{value}</strong>
                <small>{hint}</small>
              </div>
            </article>
          ))}
        </div>
      </LoadState>

      <section className="portal-section" aria-labelledby="portal-continue">
        <div className="portal-section-head">
          <h2 id="portal-continue">Continúa tu aprendizaje</h2>
          {list.length > 3 && <a className="portal-link" href="#mi-espacio/cursos">Ver todos →</a>}
        </div>
        <LoadState loading={courses.loading} error={courses.error} onRetry={courses.reload} hasData={Boolean(courses.data)}>
          {list.length === 0 ? (
            <EmptyLearning />
          ) : (
            <div className="portal-grid">
              {featured.map((course) => <CourseCard course={course} key={course.course_id} />)}
            </div>
          )}
        </LoadState>
      </section>

      <p className="portal-quote">Todo gran cambio comienza con una simple decisión: la de escuchar tu voz interior.</p>
    </>
  );
}
