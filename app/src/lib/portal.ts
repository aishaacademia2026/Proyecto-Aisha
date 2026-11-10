// Data layer for "Mi espacio Aisha". Everything goes through SECURITY DEFINER functions from
// supabase/migrations/20261103000000_student_portal.sql, which check the learner's permission on the server.
import { AccessError, rpc, type ContentType } from "./access";
import { supabase } from "./supabase";

export type LearningStatus = "not_started" | "in_progress" | "completed";
export type LessonStatus = "none" | "in_progress" | "completed";
export type LessonType = "video" | "text" | "pdf" | "audio" | "exercise" | "download";
export type ResourceKind = "guide" | "meditation" | "exercise" | "video" | "other";

export type PortalCourse = {
  course_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  content_type: ContentType;
  category: string | null;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number | null;
  learning_status: LearningStatus;
  continue_lesson_id: string | null;
  last_accessed_at: string | null;
  granted_at: string;
};

export type PortalDashboard = {
  active_courses: number;
  active_workshops: number;
  workshops_in_progress: number;
  started_courses: number;
  completed_courses: number;
  completed_workshops: number;
  lessons_total: number;
  lessons_completed: number;
  overall_percent: number | null;
  certificates: number;
};

export type OutlineLesson = {
  id: string;
  title: string;
  content_type: LessonType;
  duration_minutes: number | null;
  is_required: boolean;
  status: LessonStatus;
};

export type OutlineModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: OutlineLesson[];
};

export type CourseOutline = {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    cover_image: string | null;
    content_type: ContentType;
    category: string | null;
  };
  preview: boolean;
  modules: OutlineModule[];
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number | null;
  continue_lesson_id: string | null;
};

export type LessonContent = {
  id: string;
  title: string;
  content_type: LessonType;
  body: string | null;
  media_url: string | null;
  storage_path: string | null;
  duration_minutes: number | null;
  is_required: boolean;
  media_duration_seconds: number | null;
  media_size_bytes: number | null;
  media_mime_type: string | null;
  media_width: number | null;
  media_height: number | null;
  module_id: string;
  module_title: string;
  course_id: string;
  course_title: string;
  course_slug: string;
  status: LessonStatus;
  prev_lesson_id: string | null;
  next_lesson_id: string | null;
  preview: boolean;
};

export type LessonProgressResult = {
  status: "in_progress" | "completed";
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number | null;
};

export type PortalResource = {
  resource_id: string;
  title: string;
  description: string | null;
  kind: ResourceKind;
  external_url: string | null;
  storage_path: string | null;
  is_public: boolean;
  course_id: string | null;
  course_title: string | null;
  course_slug: string | null;
};

export type PortalCertificate = {
  certificate_id: string;
  course_title: string;
  student_name: string;
  certificate_code: string | null;
  issued_at: string;
  storage_path: string | null;
};

export const getPortalCourses = () => rpc<PortalCourse[]>("my_courses_progress");
export const getPortalDashboard = () => rpc<PortalDashboard>("my_dashboard");
export const getCourseOutline = (slug: string) => rpc<CourseOutline | null>("get_course_outline", { p_slug: slug });
export const openLesson = (lessonId: string) => rpc<LessonContent | null>("open_lesson", { p_lesson: lessonId });
export const setLessonCompleted = (lessonId: string, completed: boolean) =>
  rpc<LessonProgressResult>("set_lesson_completed", { p_lesson: lessonId, p_completed: completed });
export const getMyResources = () => rpc<PortalResource[]>("my_resources");
export const getMyCertificates = () => rpc<PortalCertificate[]>("my_certificates");
export const updateMyName = (name: string) => rpc<string>("update_my_name", { p_full_name: name });

// Private files live in a non-public bucket: each open asks for a short-lived signed URL, and Storage
// policies decide whether this person may read that path.
export async function signedUrl(path: string, ttlSeconds = 120, download = false): Promise<string> {
  if (!supabase) throw new AccessError("El servicio de cuentas no está configurado.");
  const { data, error } = await supabase.storage
    .from("course-files")
    .createSignedUrl(path, ttlSeconds, download ? { download: true } : undefined);
  if (error || !data?.signedUrl) throw new AccessError("Este archivo no está disponible en este momento.");
  return data.signedUrl;
}

// Only well-known video hosts are embedded; anything else is shown as a plain link or <video>.
export function videoEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? (url.pathname.startsWith("/embed/") ? url.pathname.slice(7) : null);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

export const lessonTypeLabel: Record<LessonType, string> = {
  video: "Vídeo",
  text: "Lectura",
  pdf: "Documento",
  audio: "Audio guiado",
  exercise: "Ejercicio",
  download: "Material descargable",
};

export const resourceKindLabel: Record<ResourceKind, string> = {
  guide: "Guías y materiales",
  meditation: "Meditaciones",
  exercise: "Ejercicios prácticos",
  video: "Vídeos de apoyo",
  other: "Otros recursos",
};

export const learningStatusLabel: Record<LearningStatus, string> = {
  not_started: "Sin comenzar",
  in_progress: "En progreso",
  completed: "Completado",
};

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
