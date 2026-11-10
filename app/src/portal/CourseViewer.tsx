import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock3, Lock, PlayCircle } from "lucide-react";
import { messageOf } from "../lib/access";
import {
  getCourseOutline,
  formatClock,
  lessonTypeLabel,
  openLesson,
  setLessonCompleted,
  signedUrl,
  videoEmbedUrl,
  type CourseOutline,
  type LessonContent,
  type LessonStatus,
} from "../lib/portal";
import { LoadState, typeLabel, useLoad } from "../pages/access-ui";
import { FileButton, ProgressBar, courseHref, lessonHref } from "./ui";

export function CourseViewer({ slug, lessonId }: { slug: string; lessonId: string | null }) {
  // The server returns the course only when this person has an active permission.
  const outline = useLoad(() => getCourseOutline(slug), [slug]);
  const data = outline.data;

  return (
    <LoadState loading={outline.loading} error={outline.error} onRetry={outline.reload} hasData={data !== null || !outline.loading}>
      {data ? (
        <>
          {data.preview && <p className="form-notice">Vista previa de administración: esta cuenta no tiene un acceso asignado a este contenido.</p>}
          {lessonId ? (
            <LessonView outline={data} lessonId={lessonId} onProgress={outline.reload} />
          ) : (
            <CourseHome outline={data} />
          )}
        </>
      ) : (
        <div className="gate-card">
          <Lock size={34} strokeWidth={1.4} aria-hidden="true" />
          <h1>Tu acceso a este contenido no está activo</h1>
          <p>Este contenido no está disponible para tu cuenta en este momento. Si crees que es un error, escríbenos y lo revisamos.</p>
          <div className="gate-actions">
            <a className="button" href="#mi-espacio/cursos">Ver mis cursos y talleres</a>
            <a className="button button-outline" href="#contacto">Contactar</a>
          </div>
        </div>
      )}
    </LoadState>
  );
}

function StatusIcon({ status }: { status: LessonStatus }) {
  if (status === "completed") return <CheckCircle2 size={20} className="lesson-done" aria-label="Completada" />;
  if (status === "in_progress") return <PlayCircle size={20} className="lesson-doing" aria-label="En progreso" />;
  return <Circle size={20} className="lesson-todo" aria-label="Sin comenzar" />;
}

function ModuleList({ outline, current }: { outline: CourseOutline; current?: string }) {
  if (outline.modules.length === 0) return null;
  return (
    <div className="portal-modules">
      {outline.modules.map((module, index) => (
        <details key={module.id} open={index === 0 || module.lessons.some((lesson) => lesson.id === current)}>
          <summary>
            <span>{/^módulos/i.test(module.title) ? module.title : `Módulo ${index + 1}: ${module.title}`}</span>
            <small>{module.lessons.filter((lesson) => lesson.status === "completed").length}/{module.lessons.length}</small>
          </summary>
          {module.description && <p className="portal-module-desc">{module.description}</p>}
          <ul>
            {module.lessons.map((lesson) => (
              <li key={lesson.id}>
                <a href={lessonHref(outline.course.slug, lesson.id)} aria-current={lesson.id === current ? "page" : undefined} className={lesson.id === current ? "current" : undefined}>
                  <StatusIcon status={lesson.status} />
                  <span className="lesson-title">{lesson.title}</span>
                  <span className="lesson-meta">
                    {lessonTypeLabel[lesson.content_type]}
                    {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ""}
                    {!lesson.is_required ? " · opcional" : ""}
                  </span>
                </a>
              </li>
            ))}
            {module.lessons.length === 0 && <li className="portal-module-empty">Las lecciones de este módulo se están preparando.</li>}
          </ul>
        </details>
      ))}
    </div>
  );
}

function CourseHome({ outline }: { outline: CourseOutline }) {
  const { course } = outline;
  const percent = outline.progress_percent;
  const hasLessons = outline.modules.some((module) => module.lessons.length > 0);
  const started = outline.modules.some((module) => module.lessons.some((lesson) => lesson.status !== "none"));
  return (
    <>
      <a className="portal-back" href="#mi-espacio/cursos"><ArrowLeft size={16} aria-hidden="true" /> Mis cursos y talleres</a>
      <section className="portal-course-head">
        {course.cover_image && <img src={course.cover_image} alt="" />}
        <div>
          <p className="eyebrow">{typeLabel(course.content_type)}{course.category ? ` · ${course.category}` : ""}</p>
          <h1>{course.title}</h1>
          {course.description && <p className="portal-course-desc">{course.description}</p>}
          {percent !== null ? (
            <div className="portal-course-progress">
              <div className="portal-card-progress-head"><span>Tu avance</span><strong>{percent}%</strong></div>
              <ProgressBar percent={percent} label={`Avance de ${course.title}`} />
              <p className="portal-card-count">{outline.completed_lessons} de {outline.total_lessons} lecciones completadas</p>
            </div>
          ) : null}
          {outline.continue_lesson_id ? (
            <a className="portal-btn portal-btn-lg" href={lessonHref(course.slug, outline.continue_lesson_id)}>
              {started ? "Continuar donde lo dejaste" : "Comenzar"} <ArrowRight size={16} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </section>

      {hasLessons ? (
        <ModuleList outline={outline} />
      ) : (
        <div className="course-view-soon">
          <p>El contenido de este {course.content_type === "workshop" ? "taller" : "curso"} se está preparando. Cuando esté listo, lo encontrarás aquí.</p>
        </div>
      )}
    </>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((block, index) => (
        <p key={index}>{block}</p>
      ))}
    </>
  );
}

function LessonMedia({ lesson }: { lesson: LessonContent }) {
  const isMedia = lesson.content_type === "video" || lesson.content_type === "audio";
  // Files in the private bucket get a signed URL that lasts long enough to watch or listen.
  const media = useLoad(async () => {
    if (isMedia && lesson.storage_path) return signedUrl(lesson.storage_path, 1800);
    return lesson.media_url;
  }, [lesson.id]);

  const hasAnything = Boolean(lesson.body || lesson.media_url || lesson.storage_path);

  return (
    <div className="portal-lesson-media">
      {lesson.content_type === "video" && (() => {
        const embed = lesson.media_url ? videoEmbedUrl(lesson.media_url) : null;
        if (embed) {
          return (
            <div className="portal-video">
              <iframe src={embed} title={lesson.title} loading="lazy" allow="fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          );
        }
        return (
          <LoadState loading={media.loading} error={media.error} onRetry={media.reload} hasData={Boolean(media.data)} empty="El vídeo no está disponible en este momento.">
            <div
              className={`portal-stage${lesson.media_height && lesson.media_width && lesson.media_height > lesson.media_width ? " is-portrait" : ""}`}
              style={lesson.media_width && lesson.media_height ? { aspectRatio: `${lesson.media_width} / ${lesson.media_height}` } : undefined}
            >
              <video
                className="portal-video-el"
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                onContextMenu={(event) => event.preventDefault()}
                aria-label={lesson.title}
                src={media.data ?? undefined}
              />
            </div>
          </LoadState>
        );
      })()}

      {lesson.content_type === "audio" && (
        <LoadState loading={media.loading} error={media.error} onRetry={media.reload} hasData={Boolean(media.data)} empty="El audio no está disponible en este momento.">
          <audio className="portal-player portal-audio" controls preload="metadata" src={media.data ?? undefined} />
        </LoadState>
      )}

      {(lesson.content_type === "pdf" || lesson.content_type === "download") && (lesson.storage_path || lesson.media_url) && (
        <div className="portal-file">
          <FileButton path={lesson.storage_path} url={lesson.media_url} download={lesson.content_type === "download"}>
            {lesson.content_type === "download" ? "Descargar material" : "Abrir documento"}
          </FileButton>
        </div>
      )}

      {lesson.body && (
        <div className="portal-lesson-text"><Paragraphs text={lesson.body} /></div>
      )}

      {!hasAnything && (
        <div className="course-view-soon"><p>El contenido de esta lección se está preparando.</p></div>
      )}
    </div>
  );
}

function LessonView({ outline, lessonId, onProgress }: { outline: CourseOutline; lessonId: string; onProgress: () => void }) {
  const lesson = useLoad(() => openLesson(lessonId), [lessonId]);
  const data = lesson.data;
  const [status, setStatus] = useState<LessonStatus>("none");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    setStatus(data?.status ?? "none");
    setSaveError(null);
    setSaved(null);
  }, [data]);

  async function toggle() {
    if (!data) return;
    const next = status !== "completed";
    setSaving(true);
    setSaveError(null);
    setSaved(null);
    try {
      const result = await setLessonCompleted(data.id, next);
      setStatus(result.status);
      setSaved(next ? "Lección marcada como completada." : "Lección marcada como pendiente.");
      onProgress();
    } catch (error) {
      setSaveError(messageOf(error));
    } finally {
      setSaving(false);
    }
  }

  const percent = outline.progress_percent;

  return (
    <>
      <a className="portal-back" href={courseHref(outline.course.slug)}><ArrowLeft size={16} aria-hidden="true" /> {outline.course.title}</a>
      <LoadState loading={lesson.loading} error={lesson.error} onRetry={lesson.reload} hasData={data !== null || !lesson.loading}>
        {data ? (
          <div className="portal-lesson-layout">
            <article className="portal-lesson">
              <p className="eyebrow">{data.module_title}</p>
              <h1>{data.title}</h1>
              <p className="portal-lesson-meta">
                <span>{lessonTypeLabel[data.content_type]}</span>
                {data.media_duration_seconds ? (
                  <span><Clock3 size={14} aria-hidden="true" /> {formatClock(data.media_duration_seconds)}</span>
                ) : data.duration_minutes ? (
                  <span><Clock3 size={14} aria-hidden="true" /> {data.duration_minutes} min</span>
                ) : null}
                {!data.is_required && <span>Opcional</span>}
              </p>

              <LessonMedia key={data.id} lesson={data} />

              <div className="portal-lesson-actions">
                {!data.preview && (
                  <button type="button" className={`portal-btn${status === "completed" ? " is-done" : ""}`} aria-pressed={status === "completed"} onClick={toggle} disabled={saving}>
                    {saving ? "Guardando…" : status === "completed" ? "Completada · deshacer" : "Marcar como completada"}
                  </button>
                )}
                {saved && <p className="portal-saved" role="status">{saved}</p>}
                {saveError && <p className="portal-inline-error" role="alert">{saveError}</p>}
              </div>

              <nav className="portal-lesson-nav" aria-label="Navegación entre lecciones">
                {data.prev_lesson_id ? <a href={lessonHref(data.course_slug, data.prev_lesson_id)}><ArrowLeft size={16} aria-hidden="true" /> Lección anterior</a> : <span />}
                {data.next_lesson_id ? <a href={lessonHref(data.course_slug, data.next_lesson_id)}>Siguiente lección <ArrowRight size={16} aria-hidden="true" /></a> : <span />}
              </nav>
            </article>

            <aside className="portal-lesson-side" aria-label="Contenido del curso">
              {percent !== null && (
                <div className="portal-course-progress">
                  <div className="portal-card-progress-head"><span>Tu avance</span><strong>{percent}%</strong></div>
                  <ProgressBar percent={percent} label={`Avance de ${outline.course.title}`} />
                </div>
              )}
              <ModuleList outline={outline} current={data.id} />
            </aside>
          </div>
        ) : (
          <div className="gate-card">
            <Lock size={34} strokeWidth={1.4} aria-hidden="true" />
            <h1>Esta lección no está disponible</h1>
            <p>No pudimos encontrar esta lección o tu acceso no está activo.</p>
            <a className="button" href={courseHref(outline.course.slug)}>Volver al curso</a>
          </div>
        )}
      </LoadState>
    </>
  );
}
