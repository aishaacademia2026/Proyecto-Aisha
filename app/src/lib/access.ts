// Data layer for the access module. Every call goes through a SECURITY DEFINER function in
// supabase/migrations/20261102000000_access_module.sql, which re-checks the caller's role on the server.
import { supabase } from "./supabase";

export type ContentType = "course" | "workshop";
export type Publication = "draft" | "published" | "archived";
export type AccessState = "active" | "revoked" | "none";
export type Role = "student" | "admin";

export type Profile = { id: string; full_name: string | null; email: string | null; role: Role };

export type DashboardStats = {
  students: number;
  published_courses: number;
  published_workshops: number;
  active_access: number;
  revoked_access: number;
};

export type StudentRow = {
  student_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  courses_count: number;
  workshops_count: number;
  // Missing while the database still has the first version of admin_list_students().
  access_state?: AccessState;
};

export type CourseRow = {
  course_id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  content_type: ContentType;
  category: string | null;
  publication_status: Publication;
  active_students: number;
};

export type StudentAccessRow = {
  course_id: string;
  title: string;
  cover_image: string | null;
  content_type: ContentType;
  category: string | null;
  publication_status: Publication;
  access_status: AccessState;
};

export type CourseStudentRow = {
  student_id: string;
  full_name: string | null;
  email: string | null;
  access_status: "active" | "revoked";
  granted_at: string;
  revoked_at: string | null;
};

export type AuditRow = {
  log_id: number;
  performed_at: string;
  action: "grant" | "revoke" | "reactivate";
  previous_status: string | null;
  new_status: string;
  student_name: string | null;
  student_email: string | null;
  course_title: string | null;
  admin_name: string | null;
};

export type MemberCourse = {
  course_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  content_type: ContentType;
  category: string | null;
  access_status: string;
  granted_at?: string;
};

export type Paged<T> = { rows: T[]; total: number };

export class AccessError extends Error {}

// Codes raised on purpose by the SQL functions carry a message that is safe and useful to show.
const SAFE_CODES = new Set(["22023", "P0002", "23514"]);

function toAccessError(error: { message: string; code?: string }): AccessError {
  if (error.code && SAFE_CODES.has(error.code)) return new AccessError(error.message);
  if (error.code === "42501") return new AccessError("No tienes permiso para realizar esta acción.");
  if (error.code === "PGRST301" || /jwt|token/i.test(error.message)) {
    return new AccessError("Tu sesión expiró. Vuelve a iniciar sesión para continuar.");
  }
  return new AccessError("No pudimos completar la operación. Inténtalo de nuevo en unos minutos.");
}

export function messageOf(error: unknown): string {
  return error instanceof AccessError
    ? error.message
    : "No pudimos completar la operación. Inténtalo de nuevo en unos minutos.";
}

export async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new AccessError("El servicio de cuentas no está configurado.");
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw toAccessError(error);
  return data as T;
}

function paged<T extends { total_count?: number | string }>(rows: T[] | null): Paged<Omit<T, "total_count">> {
  const list = rows ?? [];
  const total = Number(list[0]?.total_count ?? 0);
  return { rows: list.map(({ total_count: _ignored, ...rest }) => rest), total };
}

export async function getMyProfile(): Promise<Profile | null> {
  const rows = await rpc<Profile[]>("my_profile");
  return rows[0] ?? null;
}

export const getDashboardStats = () => rpc<DashboardStats>("admin_dashboard_stats");

export async function listStudents(p: { search: string; limit: number; offset: number }) {
  const rows = await rpc<(StudentRow & { total_count: number })[]>("admin_list_students", {
    p_search: p.search,
    p_limit: p.limit,
    p_offset: p.offset,
  });
  return paged(rows) as Paged<StudentRow>;
}

export async function listCourses(p: { search: string; type: string; status: string; limit: number; offset: number }) {
  const rows = await rpc<(CourseRow & { total_count: number })[]>("admin_list_courses", {
    p_search: p.search,
    p_type: p.type,
    p_status: p.status,
    p_limit: p.limit,
    p_offset: p.offset,
  });
  return paged(rows) as Paged<CourseRow>;
}

export const getStudentAccess = (userId: string) =>
  rpc<StudentAccessRow[]>("admin_student_access", { p_user: userId });

export async function listCourseStudents(courseId: string, limit: number, offset: number) {
  const rows = await rpc<(CourseStudentRow & { total_count: number })[]>("admin_course_students", {
    p_course: courseId,
    p_limit: limit,
    p_offset: offset,
  });
  return paged(rows) as Paged<CourseStudentRow>;
}

export const setAccess = (userId: string, courseIds: string[], grant: boolean) =>
  rpc<{ changed: number; unchanged: number }>("admin_set_access", {
    p_user: userId,
    p_courses: courseIds,
    p_grant: grant,
  });

export async function listAudit(limit: number, offset: number) {
  const rows = await rpc<(AuditRow & { total_count: number })[]>("admin_list_audit", {
    p_limit: limit,
    p_offset: offset,
  });
  return paged(rows) as Paged<AuditRow>;
}

export const getMyCourses = () => rpc<MemberCourse[]>("my_courses");

export async function getCourseForMember(slug: string): Promise<MemberCourse | null> {
  const rows = await rpc<MemberCourse[]>("get_course_for_member", { p_slug: slug });
  return rows[0] ?? null;
}
