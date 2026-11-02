import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { BookOpen, CircleX, ExternalLink, Flower2, GraduationCap, History, Home, KeyRound, LayoutGrid, LogOut, Search, SquareCheckBig, Users } from "lucide-react";
import {
  getDashboardStats,
  getStudentAccess,
  listAudit,
  listCourses,
  listCourseStudents,
  listStudents,
  messageOf,
  setAccess,
  type AccessState,
  type CourseRow,
  type DashboardStats,
  type StudentAccessRow,
  type StudentRow,
} from "../lib/access";
import {
  AccessBadge,
  ConfirmDialog,
  LoadState,
  Modal,
  Pagination,
  PublicationBadge,
  formatDate,
  formatDateTime,
  typeLabel,
  useDebounced,
  useLoad,
} from "./access-ui";
import { LotusIcon } from "./brand";

export type AdminTab = "resumen" | "estudiantes" | "cursos" | "accesos" | "historial";

const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: "resumen", label: "Resumen", icon: Home },
  { id: "estudiantes", label: "Estudiantes", icon: Users },
  { id: "cursos", label: "Cursos y talleres", icon: LayoutGrid },
  { id: "accesos", label: "Gestión de accesos", icon: KeyRound },
  { id: "historial", label: "Historial de asignaciones", icon: History },
];

const PAGE_SIZE = 10;

export function adminTabFromHash(hash: string): AdminTab {
  const part = hash.replace(/^#admin\/?/, "").split(/[/?]/)[0];
  return tabs.some((tab) => tab.id === part) ? (part as AdminTab) : "resumen";
}

function initials(name: string): string {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function Avatar({ name, src, className }: { name: string; src?: string; className: string }) {
  return src ? (
    <img className={className} src={src} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className={`${className} avatar-initials`} aria-hidden="true">{initials(name)}</span>
  );
}

export function AdminPanel({ tab, session, onSignOut }: { tab: AdminTab; session: Session; onSignOut: () => void }) {
  const [query, setQuery] = useState("");
  const [seed, setSeed] = useState("");
  const meta = session.user.user_metadata;
  const name: string = meta.full_name || meta.name || session.user.email || "Administrador";
  const avatar: string | undefined = meta.avatar_url || meta.picture || undefined;

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setSeed(query.trim());
    window.location.hash = "#admin/estudiantes";
  }

  return (
    <div className="admin-app">
      <div className="admin-frame">
        <aside className="admin-side">
          <a className="admin-brand" href="#admin/resumen" aria-label="Aisha, resumen de administración">
            <span className="admin-brand-top"><LotusIcon /><strong>Aisha</strong></span>
            <small>ACADEMIA ONLINE DE MEDIUMNIDAD</small>
          </a>
          <nav aria-label="Administración">
            {tabs.map(({ id, label, icon: Icon }) => (
              <a key={id} href={`#admin/${id}`} className={tab === id ? "active" : undefined} aria-current={tab === id ? "page" : undefined}>
                <Icon size={20} strokeWidth={1.7} aria-hidden="true" /> {label}
              </a>
            ))}
          </nav>
          <div className="admin-user">
            <div className="admin-user-row">
              <Avatar name={name} src={avatar} className="admin-avatar" />
              <div>
                <strong>Administrador</strong>
                <span>{session.user.email}</span>
              </div>
            </div>
            <button type="button" onClick={onSignOut}><LogOut size={16} aria-hidden="true" /> Cerrar sesión</button>
          </div>
        </aside>

        <div className="admin-body">
          <header className="admin-topbar">
            <form className="admin-global-search" role="search" onSubmit={submitSearch}>
              <label>
                <span className="sr-only">Buscar estudiantes</span>
                <Search size={18} aria-hidden="true" />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar estudiantes por nombre o correo…" />
              </label>
            </form>
            <a className="admin-site-link" href="#inicio"><ExternalLink size={16} aria-hidden="true" /> Ver sitio</a>
            <div className="admin-me">
              <Avatar name={name} src={avatar} className="admin-avatar" />
              <div>
                <strong>{name}</strong>
                <span>Administrador</span>
              </div>
            </div>
          </header>

          <div className="admin-content">
            {tab === "resumen" && <OverviewTab />}
            {tab === "estudiantes" && <StudentsTab key={seed} initialSearch={seed} />}
            {tab === "cursos" && <CoursesTab />}
            {tab === "accesos" && <AccessTab />}
            {tab === "historial" && <AuditTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="admin-head">
      <h1>{title}</h1>
      <p>{intro}</p>
    </header>
  );
}

function SearchBox({ value, onChange, label, placeholder }: { value: string; onChange: (value: string) => void; label: string; placeholder: string }) {
  return (
    <label className="admin-search">
      <span className="sr-only">{label}</span>
      <Search size={18} aria-hidden="true" />
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

/* ---------------------------------------------------------- Indicadores */

const statDefs: { key: keyof DashboardStats; label: string; icon: typeof Users; tone: string }[] = [
  { key: "students", label: "Total estudiantes", icon: Users, tone: "amber" },
  { key: "published_courses", label: "Cursos publicados", icon: BookOpen, tone: "orange" },
  { key: "published_workshops", label: "Talleres publicados", icon: Flower2, tone: "rose" },
  { key: "active_access", label: "Accesos activos", icon: SquareCheckBig, tone: "green" },
  { key: "revoked_access", label: "Accesos revocados", icon: CircleX, tone: "red" },
];

function StatsSection({ children }: { children?: React.ReactNode }) {
  const stats = useLoad(getDashboardStats, []);
  return (
    <LoadState loading={stats.loading} error={stats.error} onRetry={stats.reload} hasData={Boolean(stats.data)}>
      <div className="stat-grid">
        {statDefs.map(({ key, label, icon: Icon, tone }) => (
          <article className="stat-card" key={key}>
            <span className={`stat-icon tone-${tone}`}><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span>
            <div>
              <span className="stat-label">{label}</span>
              <strong>{stats.data?.[key] ?? "—"}</strong>
            </div>
          </article>
        ))}
      </div>
      {children}
    </LoadState>
  );
}

/* ------------------------------------------------------------------ Resumen */

function OverviewTab() {
  return (
    <>
      <SectionHead title="Resumen" intro="Una mirada rápida al estado de la academia." />
      <StatsSection>
        <p className="admin-hint">
          Para asignar o retirar un acceso, ve a <a href="#admin/estudiantes">Estudiantes</a>,
          busca a la persona y pulsa «Gestionar accesos».
        </p>
      </StatsSection>
    </>
  );
}

/* ------------------------------------------------------- Gestión de accesos */

function AccessTab() {
  const recent = useLoad(() => listAudit(5, 0), []);
  const rows = recent.data?.rows ?? [];
  return (
    <>
      <SectionHead title="Gestión de accesos" intro="Administra qué cursos y talleres están disponibles para cada estudiante." />
      <StatsSection />
      <section className="recent-card" aria-labelledby="recent-title">
        <h2 id="recent-title">Accesos recientes</h2>
        <LoadState loading={recent.loading} error={recent.error} onRetry={recent.reload} hasData={Boolean(recent.data)}>
          {rows.length === 0 ? (
            <div className="state-box"><p>Todavía no hay movimientos. Asigna un curso desde «Estudiantes» y aparecerá aquí.</p></div>
          ) : (
            <ul className="recent-list">
              {rows.map((row) => {
                const who = row.student_name || row.student_email || "Estudiante";
                const active = row.new_status === "active";
                return (
                  <li key={row.log_id}>
                    <Avatar name={who} className="recent-avatar" />
                    <strong>{who}</strong>
                    <span className={active ? "recent-grant" : "recent-revoke"}>{actionLabels[row.action]}</span>
                    <span className="recent-course">{row.course_title || "—"}</span>
                    <time dateTime={row.performed_at}>{formatDateTime(row.performed_at)}</time>
                    <span className={`badge badge-access-${active ? "active" : "revoked"}`}>{active ? "Activo" : "Revocado"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </LoadState>
        <div className="recent-foot">
          <a href="#admin/estudiantes">Gestionar accesos de un estudiante →</a>
          <a href="#admin/historial">Ver todo el historial →</a>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------ Estudiantes y accesos */

function StudentsTab({ initialSearch }: { initialSearch: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [managing, setManaging] = useState<StudentRow | null>(null);
  const debounced = useDebounced(search);

  useEffect(() => setPage(1), [debounced]);

  const list = useLoad(
    () => listStudents({ search: debounced.trim(), limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    [debounced, page],
  );
  const rows = list.data?.rows ?? [];

  return (
    <>
      <SectionHead title="Estudiantes" intro="Busca a una persona registrada y decide a qué cursos y talleres puede entrar." />
      <div className="admin-toolbar">
        <SearchBox value={search} onChange={setSearch} label="Buscar estudiante" placeholder="Buscar por nombre o correo" />
      </div>
      <LoadState loading={list.loading} error={list.error} onRetry={list.reload} hasData={Boolean(list.data)}>
        {rows.length === 0 ? (
          <div className="state-box"><p>{debounced.trim() ? "No encontramos estudiantes con esa búsqueda." : "Aún no hay estudiantes registrados."}</p></div>
        ) : (
          <div className="table-wrap" aria-busy={list.loading}>
            <table className="admin-table">
              <thead>
                <tr><th scope="col">Estudiante</th><th scope="col">Correo</th><th scope="col">Registro</th><th scope="col">Estado</th><th scope="col">Cursos</th><th scope="col">Talleres</th><th scope="col"><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody>
                {rows.map((student) => (
                  <tr key={student.student_id}>
                    <td data-label="Estudiante"><strong>{student.full_name || "Sin nombre"}</strong></td>
                    <td data-label="Correo">{student.email}</td>
                    <td data-label="Registro">{formatDate(student.created_at)}</td>
                    <td data-label="Estado"><AccessBadge status={studentState(student)} /></td>
                    <td data-label="Cursos">{student.courses_count}</td>
                    <td data-label="Talleres">{student.workshops_count}</td>
                    <td className="cell-actions">
                      <button className="button button-small" type="button" onClick={() => setManaging(student)}>Gestionar accesos</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={list.data?.total ?? 0} onPage={setPage} />
      </LoadState>

      {managing && (
        <ManageAccessDialog
          student={managing}
          onClose={() => {
            setManaging(null);
            list.reload();
          }}
        />
      )}
    </>
  );
}

// Uses the state computed by the database; falls back to the visible counts if it is not there yet.
function studentState(student: StudentRow): AccessState {
  return student.access_state ?? (student.courses_count + student.workshops_count > 0 ? "active" : "none");
}

type Pending = { grant: boolean; rows: StudentAccessRow[] };

function ManageAccessDialog({ student, onClose }: { student: StudentRow; onClose: () => void }) {
  const access = useLoad(() => getStudentAccess(student.student_id), [student.student_id]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = access.data ?? [];
  const name = student.full_name || student.email || "el estudiante";
  const canGrant = (row: StudentAccessRow) => row.access_status !== "active" && row.publication_status !== "archived";

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const result = await setAccess(student.student_id, pending.rows.map((row) => row.course_id), pending.grant);
      const titles = pending.rows.map((row) => `«${row.title}»`).join(", ");
      if (result.changed === 0) setNotice("No hubo cambios: el estado ya era el solicitado.");
      else setNotice(pending.grant ? `Acceso otorgado a ${name}: ${titles}.` : `Acceso revocado a ${name}: ${titles}.`);
      setSelected(new Set());
      setPending(null);
      access.reload();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  const selectedRows = rows.filter((row) => selected.has(row.course_id) && canGrant(row));

  return (
    <>
      <Modal title="Gestionar accesos" onClose={onClose} wide>
        <div className="modal-body">
          <p className="manage-student"><strong>{student.full_name || "Sin nombre"}</strong><span>{student.email}</span></p>
          {notice && <p className="form-notice" role="status">{notice}</p>}
          <LoadState loading={access.loading} error={access.error} onRetry={access.reload} hasData={Boolean(access.data)} empty="Todavía no hay cursos ni talleres en el catálogo.">
            <ul className="access-list">
              {rows.map((row) => {
                const grantable = canGrant(row);
                return (
                  <li key={row.course_id}>
                    <label className={`access-check${grantable ? "" : " is-disabled"}`}>
                      <input
                        type="checkbox"
                        checked={selected.has(row.course_id)}
                        disabled={!grantable || busy}
                        onChange={() => toggle(row.course_id)}
                        aria-label={`Seleccionar ${row.title}`}
                      />
                    </label>
                    <div className="access-info">
                      <strong>{row.title}</strong>
                      <span>{typeLabel(row.content_type)}{row.category ? ` · ${row.category}` : ""}</span>
                      <span className="access-badges"><AccessBadge status={row.access_status} /> <PublicationBadge status={row.publication_status} /></span>
                    </div>
                    <div className="access-action">
                      {row.access_status === "active" ? (
                        <button className="button button-small button-revoke" type="button" disabled={busy} onClick={() => { setError(null); setPending({ grant: false, rows: [row] }); }}>
                          Revocar acceso
                        </button>
                      ) : grantable ? (
                        <button className="button button-small" type="button" disabled={busy} onClick={() => { setError(null); setPending({ grant: true, rows: [row] }); }}>
                          {row.access_status === "revoked" ? "Reactivar acceso" : "Otorgar acceso"}
                        </button>
                      ) : (
                        <span className="access-note">Archivado: no admite nuevas asignaciones</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </LoadState>
        </div>
        <footer className="modal-foot">
          <button className="button button-outline" type="button" onClick={onClose}>Cerrar</button>
          <button
            className="button"
            type="button"
            disabled={busy || selectedRows.length === 0}
            onClick={() => { setError(null); setPending({ grant: true, rows: selectedRows }); }}
          >
            {selectedRows.length > 0 ? `Otorgar acceso a ${selectedRows.length} seleccionado${selectedRows.length > 1 ? "s" : ""}` : "Otorgar acceso a seleccionados"}
          </button>
        </footer>
      </Modal>

      {pending && (
        <ConfirmDialog
          title={pending.grant ? "Confirmar acceso" : "Revocar acceso"}
          confirmLabel={pending.grant ? "Otorgar acceso" : "Revocar acceso"}
          danger={!pending.grant}
          busy={busy}
          error={error}
          onCancel={() => setPending(null)}
          onConfirm={confirm}
        >
          <p>
            {pending.grant ? "Vas a dar acceso a " : "Vas a retirar el acceso de "}
            <strong>{name}</strong> ({student.email}) {pending.grant ? "a:" : "a:"}
          </p>
          <ul>{pending.rows.map((row) => <li key={row.course_id}>{row.title}</li>)}</ul>
          {!pending.grant && <p className="confirm-hint">La persona no podrá entrar al contenido. Su progreso y su cuenta se conservan, y podrás reactivar el acceso cuando quieras.</p>}
        </ConfirmDialog>
      )}
    </>
  );
}

/* --------------------------------------------------------- Cursos y talleres */

function CoursesTab() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<CourseRow | null>(null);
  const debounced = useDebounced(search);

  useEffect(() => setPage(1), [debounced, type, status]);

  const list = useLoad(
    () => listCourses({ search: debounced.trim(), type, status, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    [debounced, type, status, page],
  );
  const rows = list.data?.rows ?? [];

  return (
    <>
      <SectionHead title="Cursos y talleres" intro="El catálogo es de toda la academia. Aquí ves cuántas personas tienen acceso a cada contenido." />
      <div className="admin-toolbar">
        <SearchBox value={search} onChange={setSearch} label="Buscar por nombre" placeholder="Buscar por nombre" />
        <label className="admin-select">
          <span className="sr-only">Filtrar por tipo</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="course">Cursos</option>
            <option value="workshop">Talleres</option>
          </select>
        </label>
        <label className="admin-select">
          <span className="sr-only">Filtrar por estado de publicación</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos los estados</option>
            <option value="published">Publicado</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivado</option>
          </select>
        </label>
      </div>
      <LoadState loading={list.loading} error={list.error} onRetry={list.reload} hasData={Boolean(list.data)}>
        {rows.length === 0 ? (
          <div className="state-box"><p>No hay contenidos que coincidan con los filtros.</p></div>
        ) : (
          <div className="table-wrap" aria-busy={list.loading}>
            <table className="admin-table">
              <thead>
                <tr><th scope="col">Contenido</th><th scope="col">Tipo</th><th scope="col">Categoría</th><th scope="col">Publicación</th><th scope="col">Con acceso</th><th scope="col"><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody>
                {rows.map((course) => (
                  <tr key={course.course_id}>
                    <td data-label="Contenido">
                      <span className="course-cell">
                        {course.cover_image ? <img src={course.cover_image} alt="" loading="lazy" /> : <span className="course-cell-ph"><GraduationCap size={20} aria-hidden="true" /></span>}
                        <strong>{course.title}</strong>
                      </span>
                    </td>
                    <td data-label="Tipo">{typeLabel(course.content_type)}</td>
                    <td data-label="Categoría">{course.category || "—"}</td>
                    <td data-label="Publicación"><PublicationBadge status={course.publication_status} /></td>
                    <td data-label="Con acceso">{course.active_students}</td>
                    <td className="cell-actions">
                      <button className="button button-small button-outline" type="button" onClick={() => setViewing(course)}>Estudiantes autorizados</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={list.data?.total ?? 0} onPage={setPage} />
      </LoadState>

      {viewing && (
        <CourseStudentsDialog
          course={viewing}
          onClose={() => {
            setViewing(null);
            list.reload();
          }}
        />
      )}
    </>
  );
}

function CourseStudentsDialog({ course, onClose }: { course: CourseRow; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<{ id: string; name: string; email: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const list = useLoad(() => listCourseStudents(course.course_id, 8, (page - 1) * 8), [course.course_id, page]);
  const rows = list.data?.rows ?? [];

  async function revoke() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      await setAccess(pending.id, [course.course_id], false);
      setNotice(`Acceso revocado a ${pending.name}.`);
      setPending(null);
      list.reload();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Modal title={`Estudiantes de «${course.title}»`} onClose={onClose} wide>
        <div className="modal-body">
          {notice && <p className="form-notice" role="status">{notice}</p>}
          <LoadState loading={list.loading} error={list.error} onRetry={list.reload} hasData={Boolean(list.data)}>
            {rows.length === 0 ? (
              <div className="state-box"><p>Todavía nadie tiene acceso a este contenido. Asígnalo desde «Estudiantes».</p></div>
            ) : (
              <ul className="access-list">
                {rows.map((student) => {
                  const name = student.full_name || student.email || "Sin nombre";
                  return (
                    <li key={student.student_id}>
                      <div className="access-info">
                        <strong>{name}</strong>
                        <span>{student.email}</span>
                        <span className="access-badges"><AccessBadge status={student.access_status} /> <span className="access-note">{student.access_status === "active" ? `desde ${formatDate(student.granted_at)}` : `revocado el ${formatDate(student.revoked_at)}`}</span></span>
                      </div>
                      <div className="access-action">
                        {student.access_status === "active" && (
                          <button className="button button-small button-revoke" type="button" onClick={() => { setError(null); setPending({ id: student.student_id, name, email: student.email }); }}>
                            Revocar acceso
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Pagination page={page} pageSize={8} total={list.data?.total ?? 0} onPage={setPage} />
          </LoadState>
        </div>
        <footer className="modal-foot">
          <button className="button button-outline" type="button" onClick={onClose}>Cerrar</button>
        </footer>
      </Modal>

      {pending && (
        <ConfirmDialog title="Revocar acceso" confirmLabel="Revocar acceso" danger busy={busy} error={error} onCancel={() => setPending(null)} onConfirm={revoke}>
          <p>Vas a retirar el acceso de <strong>{pending.name}</strong>{pending.email ? ` (${pending.email})` : ""} a <strong>{course.title}</strong>.</p>
          <p className="confirm-hint">Su progreso y su cuenta se conservan, y podrás reactivar el acceso cuando quieras.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Historial */

const actionLabels = { grant: "Otorgó acceso", revoke: "Revocó acceso", reactivate: "Reactivó acceso" } as const;

function AuditTab() {
  const [page, setPage] = useState(1);
  const list = useLoad(() => listAudit(PAGE_SIZE, (page - 1) * PAGE_SIZE), [page]);
  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;
  const summary = useMemo(() => (total === 1 ? "1 registro" : `${total} registros`), [total]);

  return (
    <>
      <SectionHead title="Historial de asignaciones" intro="Cada vez que alguien otorga, revoca o reactiva un acceso queda registrado aquí." />
      <LoadState loading={list.loading} error={list.error} onRetry={list.reload} hasData={Boolean(list.data)}>
        {rows.length === 0 ? (
          <div className="state-box"><p>Todavía no hay movimientos registrados.</p></div>
        ) : (
          <>
            <p className="admin-hint">{summary}</p>
            <div className="table-wrap" aria-busy={list.loading}>
              <table className="admin-table">
                <thead>
                  <tr><th scope="col">Fecha</th><th scope="col">Acción</th><th scope="col">Estudiante</th><th scope="col">Contenido</th><th scope="col">Realizada por</th></tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.log_id}>
                      <td data-label="Fecha">{formatDateTime(row.performed_at)}</td>
                      <td data-label="Acción"><span className={`badge badge-audit-${row.action}`}>{actionLabels[row.action]}</span></td>
                      <td data-label="Estudiante"><strong>{row.student_name || "—"}</strong><br /><span className="cell-sub">{row.student_email}</span></td>
                      <td data-label="Contenido">{row.course_title || "—"}</td>
                      <td data-label="Realizada por">{row.admin_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </LoadState>
    </>
  );
}
