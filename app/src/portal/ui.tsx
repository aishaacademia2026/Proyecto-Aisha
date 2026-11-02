import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AccessError, messageOf } from "../lib/access";
import { signedUrl, learningStatusLabel, type LearningStatus, type PortalCourse } from "../lib/portal";
import { typeLabel } from "../pages/access-ui";
import { LotusIcon } from "../pages/brand";

export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="portal-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

export function StatusPill({ status }: { status: LearningStatus }) {
  return <span className={`pill pill-${status}`}>{learningStatusLabel[status]}</span>;
}

export function lessonHref(slug: string, lessonId: string) {
  return `#mi-espacio/cursos/${encodeURIComponent(slug)}/${lessonId}`;
}

export function courseHref(slug: string) {
  return `#mi-espacio/cursos/${encodeURIComponent(slug)}`;
}

function actionLabel(course: PortalCourse): string {
  const workshop = course.content_type === "workshop";
  if (course.learning_status === "completed") return "Revisar contenido";
  if (course.learning_status === "in_progress") return "Continuar aprendiendo";
  return workshop ? "Comenzar taller" : "Comenzar curso";
}

export function CourseCard({ course }: { course: PortalCourse }) {
  const percent = course.progress_percent;
  const href = course.continue_lesson_id ? lessonHref(course.slug, course.continue_lesson_id) : courseHref(course.slug);
  return (
    <article className="portal-card">
      <div className="portal-card-img">
        {course.cover_image ? <img src={course.cover_image} alt="" loading="lazy" /> : <span><LotusIcon /></span>}
        <span className="portal-card-type">{typeLabel(course.content_type)}</span>
      </div>
      <div className="portal-card-body">
        <h3>{course.title}</h3>
        {course.category && <p className="portal-card-meta">{course.category}</p>}
        {course.description && <p className="portal-card-desc">{course.description}</p>}
        <div className="portal-card-progress">
          {percent !== null ? (
            <>
              <div className="portal-card-progress-head">
                <StatusPill status={course.learning_status} />
                <span>{percent}%</span>
              </div>
              <ProgressBar percent={percent} label={`Avance de ${course.title}`} />
              <p className="portal-card-count">{course.completed_lessons} de {course.total_lessons} lecciones</p>
            </>
          ) : (
            <>
              <StatusPill status={course.learning_status} />
              <p className="portal-card-count">Las lecciones se están preparando.</p>
            </>
          )}
        </div>
        <a className="portal-btn" href={href}>
          {actionLabel(course)} <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export function EmptyLearning({ explore = true }: { explore?: boolean }) {
  return (
    <div className="empty-learning">
      <span className="empty-learning-icon"><LotusIcon /></span>
      <p><strong>Tu espacio de aprendizaje está listo.</strong> Muy pronto encontrarás aquí los cursos y talleres que te acompañarán en tu camino.</p>
      {explore && <a className="portal-link" href="#cursos">Explorar el catálogo de Aisha →</a>}
    </div>
  );
}

// Opens a private file (signed, short-lived URL) or a public link, reporting failures instead of staying silent.
export async function openFile(target: { path: string | null; url: string | null }, download = false): Promise<void> {
  if (target.path) {
    const win = window.open("", "_blank");
    try {
      const url = await signedUrl(target.path, 120, download);
      if (win) {
        win.opener = null;
        win.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      win?.close();
      throw error;
    }
    return;
  }
  if (target.url && /^https?:\/\//i.test(target.url)) {
    window.open(target.url, "_blank", "noopener,noreferrer");
    return;
  }
  throw new AccessError("Este archivo no está disponible en este momento.");
}

// Button that opens a file and shows the error next to it if the file cannot be opened.
export function FileButton({
  path,
  url,
  download,
  children,
  className = "portal-btn",
}: {
  path: string | null;
  url: string | null;
  download?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function click() {
    setBusy(true);
    setError(null);
    try {
      await openFile({ path, url }, download);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button type="button" className={className} onClick={click} disabled={busy}>
        {busy ? "Abriendo…" : children}
      </button>
      {error && <p className="portal-inline-error" role="alert">{error}</p>}
    </>
  );
}
