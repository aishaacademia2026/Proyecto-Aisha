import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { Award, BookOpen, Home, Library, TrendingUp, UserRound } from "lucide-react";
import { Shell, type ShellItem } from "../pages/Shell";
import { Dashboard } from "./Dashboard";
import { CoursesPage } from "./CoursesPage";
import { CourseViewer } from "./CourseViewer";
import { CertificatesPage, ProfilePage, ProgressPage, ResourcesPage } from "./OtherPages";

export type PortalRoute =
  | { page: "home" }
  | { page: "courses" }
  | { page: "course"; slug: string }
  | { page: "lesson"; slug: string; lessonId: string }
  | { page: "progress" }
  | { page: "resources" }
  | { page: "certificates" }
  | { page: "profile" };

export function parsePortalHash(hash: string): PortalRoute {
  const parts = hash
    .replace(/^#mi-espacio\/?/, "")
    .split("?")[0]
    .split("/")
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });
  switch (parts[0]) {
    case "cursos":
      if (parts[1] && parts[2]) return { page: "lesson", slug: parts[1], lessonId: parts[2] };
      if (parts[1]) return { page: "course", slug: parts[1] };
      return { page: "courses" };
    case "progreso":
      return { page: "progress" };
    case "recursos":
      return { page: "resources" };
    case "certificados":
      return { page: "certificates" };
    case "perfil":
      return { page: "profile" };
    default:
      return { page: "home" };
  }
}

const items: ShellItem[] = [
  { id: "home", href: "#mi-espacio", label: "Mi espacio", icon: Home },
  { id: "courses", href: "#mi-espacio/cursos", label: "Mis cursos y talleres", icon: BookOpen },
  { id: "progress", href: "#mi-espacio/progreso", label: "Mi progreso", icon: TrendingUp },
  { id: "resources", href: "#mi-espacio/recursos", label: "Recursos", icon: Library },
  { id: "certificates", href: "#mi-espacio/certificados", label: "Mis certificados", icon: Award },
  { id: "profile", href: "#mi-espacio/perfil", label: "Mi perfil", icon: UserRound },
];

function activeItem(route: PortalRoute): string {
  return route.page === "course" || route.page === "lesson" ? "courses" : route.page;
}

export function PortalApp({
  session,
  hash,
  profileName,
  onNameChange,
  onSignOut,
}: {
  session: Session;
  hash: string;
  profileName: string | null;
  onNameChange: (name: string) => void;
  onSignOut: () => void;
}) {
  const route = parsePortalHash(hash);
  const meta = session.user.user_metadata;
  const name: string = (profileName || meta.full_name || meta.name || "").trim();
  const firstName = name ? name.split(/\s+/)[0] : null;
  const avatar: string | undefined = meta.avatar_url || meta.picture || undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hash]);

  return (
    <Shell
      brandHref="#mi-espacio"
      brandLabel="Aisha, Mi espacio"
      navLabel="Mi espacio Aisha"
      items={items}
      active={activeItem(route)}
      user={{ name: name || session.user.email || "Estudiante", email: session.user.email ?? "", avatar, roleLabel: "Estudiante" }}
      sidebarName={name || "Estudiante"}
      onSignOut={onSignOut}
      topbar={<p className="portal-topbar-title">Mi espacio Aisha</p>}
    >
      {route.page === "home" && <Dashboard firstName={firstName} />}
      {route.page === "courses" && <CoursesPage />}
      {route.page === "course" && <CourseViewer key={route.slug} slug={route.slug} lessonId={null} />}
      {route.page === "lesson" && <CourseViewer key={route.slug} slug={route.slug} lessonId={route.lessonId} />}
      {route.page === "progress" && <ProgressPage />}
      {route.page === "resources" && <ResourcesPage />}
      {route.page === "certificates" && <CertificatesPage />}
      {route.page === "profile" && <ProfilePage session={session} name={name} onNameChange={onNameChange} onSignOut={onSignOut} />}
    </Shell>
  );
}
