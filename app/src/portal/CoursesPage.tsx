import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getPortalCourses, type PortalCourse } from "../lib/portal";
import { LoadState, useLoad } from "../pages/access-ui";
import { CourseCard, EmptyLearning } from "./ui";

type Filter = "all" | "course" | "workshop" | "not_started" | "in_progress" | "completed";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "course", label: "Cursos" },
  { id: "workshop", label: "Talleres" },
  { id: "not_started", label: "Sin comenzar" },
  { id: "in_progress", label: "En progreso" },
  { id: "completed", label: "Completados" },
];

function matches(course: PortalCourse, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "course" || filter === "workshop") return course.content_type === filter;
  return course.learning_status === filter;
}

export function CoursesPage() {
  const courses = useLoad(getPortalCourses, []);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const list = courses.data ?? [];

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.filter((course) => matches(course, filter) && (!term || course.title.toLowerCase().includes(term)));
  }, [list, filter, search]);

  return (
    <>
      <header className="admin-head">
        <h1>Mis cursos y talleres</h1>
        <p>Aquí encontrarás los cursos y talleres a los que tienes acceso.</p>
      </header>

      <LoadState loading={courses.loading} error={courses.error} onRetry={courses.reload} hasData={Boolean(courses.data)}>
        {list.length === 0 ? (
          <EmptyLearning />
        ) : (
          <>
            <div className="portal-toolbar">
              <label className="admin-search">
                <span className="sr-only">Buscar por nombre</span>
                <Search size={18} aria-hidden="true" />
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre" />
              </label>
              <div className="portal-chips" role="group" aria-label="Filtrar contenidos">
                {filters.map(({ id, label }) => (
                  <button key={id} type="button" className={filter === id ? "active" : undefined} aria-pressed={filter === id} onClick={() => setFilter(id)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="portal-count" role="status">
              {visible.length === 1 ? "1 contenido" : `${visible.length} contenidos`}
            </p>
            {visible.length === 0 ? (
              <div className="state-box"><p>No encontramos contenidos con ese filtro. Prueba con otra opción.</p></div>
            ) : (
              <div className="portal-grid" aria-busy={courses.loading}>
                {visible.map((course) => <CourseCard course={course} key={course.course_id} />)}
              </div>
            )}
          </>
        )}
      </LoadState>
    </>
  );
}
