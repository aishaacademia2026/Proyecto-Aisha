import { useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Award, FileText } from "lucide-react";
import { messageOf } from "../lib/access";
import {
  getMyCertificates,
  getMyResources,
  getPortalCourses,
  getPortalDashboard,
  resourceKindLabel,
  updateMyName,
  type PortalResource,
  type ResourceKind,
} from "../lib/portal";
import { LoadState, formatDate, typeLabel, useLoad } from "../pages/access-ui";
import { Avatar } from "../pages/Shell";
import { EmptyLearning, FileButton, ProgressBar, StatusPill, courseHref } from "./ui";

/* --------------------------------------------------------------- Mi progreso */

export function ProgressPage() {
  const dash = useLoad(getPortalDashboard, []);
  const courses = useLoad(getPortalCourses, []);
  const d = dash.data;
  const list = courses.data ?? [];

  return (
    <>
      <header className="admin-head">
        <h1>Mi progreso</h1>
        <p>Tu avance se calcula con las lecciones que has completado en cada curso o taller.</p>
      </header>

      <LoadState loading={dash.loading} error={dash.error} onRetry={dash.reload} hasData={Boolean(dash.data)}>
        {d && (
          <>
            <section className="portal-overall">
              {d.overall_percent !== null ? (
                <>
                  <div className="portal-overall-num"><strong>{d.overall_percent}%</strong><span>de avance general</span></div>
                  <div className="portal-overall-bar">
                    <ProgressBar percent={d.overall_percent} label="Progreso general" />
                    <p>{d.lessons_completed} de {d.lessons_total} lecciones completadas</p>
                  </div>
                </>
              ) : (
                <p className="portal-overall-empty">Todavía no hay lecciones que medir en tus cursos. Cuando se publiquen, aquí verás tu avance.</p>
              )}
            </section>

            <div className="portal-metrics">
              {[
                ["Cursos iniciados", d.started_courses],
                ["Cursos completados", d.completed_courses],
                ["Talleres en progreso", d.workshops_in_progress],
                ["Lecciones completadas", d.lessons_completed],
                ["Lecciones pendientes", Math.max(d.lessons_total - d.lessons_completed, 0)],
              ].map(([label, value]) => (
                <article key={label as string}><strong>{value}</strong><span>{label}</span></article>
              ))}
            </div>
          </>
        )}
      </LoadState>

      <section className="portal-section" aria-labelledby="progress-courses">
        <div className="portal-section-head"><h2 id="progress-courses">Avance por curso y taller</h2></div>
        <LoadState loading={courses.loading} error={courses.error} onRetry={courses.reload} hasData={Boolean(courses.data)}>
          {list.length === 0 ? (
            <EmptyLearning />
          ) : (
            <ul className="portal-progress-list">
              {list.map((course) => (
                <li key={course.course_id}>
                  <div>
                    <a href={courseHref(course.slug)}><strong>{course.title}</strong></a>
                    <span>{typeLabel(course.content_type)}{course.category ? ` · ${course.category}` : ""}</span>
                  </div>
                  <div className="portal-progress-cell">
                    {course.progress_percent !== null ? (
                      <>
                        <ProgressBar percent={course.progress_percent} label={`Avance de ${course.title}`} />
                        <span>{course.progress_percent}% · {course.completed_lessons}/{course.total_lessons}</span>
                      </>
                    ) : (
                      <span>Sin lecciones aún</span>
                    )}
                  </div>
                  <StatusPill status={course.learning_status} />
                </li>
              ))}
            </ul>
          )}
        </LoadState>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ Recursos */

const kindOrder: ResourceKind[] = ["guide", "meditation", "exercise", "video", "other"];

export function ResourcesPage() {
  const resources = useLoad(getMyResources, []);
  const list = resources.data ?? [];
  const groups = kindOrder
    .map((kind) => ({ kind, items: list.filter((item) => item.kind === kind) }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <header className="admin-head">
        <h1>Recursos para tu camino</h1>
        <p>Materiales de tus cursos y talleres, y recursos abiertos para toda la comunidad.</p>
      </header>
      <LoadState loading={resources.loading} error={resources.error} onRetry={resources.reload} hasData={Boolean(resources.data)}>
        {groups.length === 0 ? (
          <div className="empty-learning">
            <span className="empty-learning-icon"><FileText size={44} strokeWidth={1.2} aria-hidden="true" /></span>
            <p><strong>Aún no hay recursos disponibles.</strong> Cuando se publiquen guías, meditaciones o ejercicios para tus cursos, los encontrarás aquí.</p>
          </div>
        ) : (
          groups.map(({ kind, items }) => (
            <section className="portal-section" key={kind} aria-labelledby={`res-${kind}`}>
              <div className="portal-section-head"><h2 id={`res-${kind}`}>{resourceKindLabel[kind]}</h2></div>
              <div className="portal-grid">
                {items.map((item) => <ResourceCard item={item} key={item.resource_id} />)}
              </div>
            </section>
          ))
        )}
      </LoadState>
    </>
  );
}

function ResourceCard({ item }: { item: PortalResource }) {
  return (
    <article className="portal-resource">
      <h3>{item.title}</h3>
      <p className="portal-card-meta">{item.course_title ?? (item.is_public ? "Recurso abierto" : "")}</p>
      {item.description && <p className="portal-card-desc">{item.description}</p>}
      <FileButton path={item.storage_path} url={item.external_url}>Abrir recurso</FileButton>
    </article>
  );
}

/* --------------------------------------------------------------- Certificados */

export function CertificatesPage() {
  const certs = useLoad(getMyCertificates, []);
  const list = certs.data ?? [];
  return (
    <>
      <header className="admin-head">
        <h1>Mis certificados</h1>
        <p>Los certificados que la academia ha emitido a tu nombre.</p>
      </header>
      <LoadState loading={certs.loading} error={certs.error} onRetry={certs.reload} hasData={Boolean(certs.data)}>
        {list.length === 0 ? (
          <div className="empty-learning">
            <span className="empty-learning-icon"><Award size={44} strokeWidth={1.2} aria-hidden="true" /></span>
            <p><strong>Todavía no tienes certificados.</strong> Cuando completes un curso y la academia emita tu certificado, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="portal-grid">
            {list.map((cert) => (
              <article className="portal-cert" key={cert.certificate_id}>
                <Award size={30} strokeWidth={1.3} aria-hidden="true" />
                <h3>{cert.course_title}</h3>
                <p className="portal-cert-name">{cert.student_name}</p>
                <p className="portal-card-meta">Emitido el {formatDate(cert.issued_at)}{cert.certificate_code ? ` · ${cert.certificate_code}` : ""}</p>
                {cert.storage_path ? (
                  <div className="portal-cert-actions">
                    <FileButton path={cert.storage_path} url={null}>Visualizar</FileButton>
                    <FileButton path={cert.storage_path} url={null} download className="portal-btn portal-btn-ghost">Descargar</FileButton>
                  </div>
                ) : (
                  <p className="portal-card-count">El archivo del certificado se está preparando.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </LoadState>
    </>
  );
}

/* ------------------------------------------------------------------ Mi perfil */

export function ProfilePage({
  session,
  name,
  onNameChange,
  onSignOut,
}: {
  session: Session;
  name: string;
  onNameChange: (name: string) => void;
  onSignOut: () => void;
}) {
  const meta = session.user.user_metadata;
  const avatar: string | undefined = meta.avatar_url || meta.picture || undefined;
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = value.trim() !== name.trim();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const stored = await updateMyName(value);
      onNameChange(stored);
      setValue(stored);
      setSaved(true);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="admin-head">
        <h1>Mi perfil</h1>
        <p>Los datos de tu cuenta en Aisha.</p>
      </header>

      <section className="portal-profile">
        <div className="portal-profile-id">
          <Avatar name={name || session.user.email || ""} src={avatar} className="portal-profile-avatar" />
          <div>
            <strong>{name || "Sin nombre"}</strong>
            <span>{session.user.email}</span>
          </div>
        </div>

        <form onSubmit={submit} className="portal-profile-form">
          <div className="field">
            <label htmlFor="profile-name">Nombre completo</label>
            <input id="profile-name" type="text" value={value} maxLength={120} autoComplete="name" onChange={(event) => { setValue(event.target.value); setSaved(false); }} aria-invalid={error ? true : undefined} />
          </div>
          <div className="field">
            <label htmlFor="profile-email">Correo electrónico</label>
            <input id="profile-email" type="email" value={session.user.email ?? ""} readOnly aria-describedby="profile-email-help" />
            <p className="portal-help" id="profile-email-help">Tu correo viene de tu cuenta de Google y no se cambia desde aquí.</p>
          </div>
          <div className="field">
            <label htmlFor="profile-since">Miembro desde</label>
            <input id="profile-since" type="text" value={formatDate(session.user.created_at)} readOnly />
          </div>
          {error && <p className="portal-inline-error" role="alert">{error}</p>}
          {saved && <p className="portal-saved" role="status">Nombre actualizado.</p>}
          <button className="button" type="submit" disabled={!dirty || saving || value.trim() === ""}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </section>

      <section className="portal-profile portal-security">
        <h2>Seguridad de la cuenta</h2>
        <p>Accedes con tu cuenta de Google. Para cambiar tu correo, tu contraseña o tu foto, hazlo en tu cuenta de Google; Aisha lo reflejará la próxima vez que inicies sesión.</p>
        <button className="button button-outline" type="button" onClick={onSignOut}>Cerrar sesión</button>
      </section>
    </>
  );
}
