import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { LotusIcon } from "./brand";

export function initials(name: string): string {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, src, className }: { name: string; src?: string; className: string }) {
  return src ? (
    <img className={className} src={src} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className={`${className} avatar-initials`} aria-hidden="true">{initials(name)}</span>
  );
}

export type ShellItem = { id: string; href: string; label: string; icon: LucideIcon };
export type ShellUser = { name: string; email: string; avatar?: string; roleLabel: string };

// Sidebar + top bar shared by the admin console and the student portal.
// On narrow screens the sidebar becomes a collapsible menu.
export function Shell({
  brandHref,
  brandLabel,
  navLabel,
  items,
  active,
  user,
  sidebarName,
  onSignOut,
  topbar,
  children,
}: {
  brandHref: string;
  brandLabel: string;
  navLabel: string;
  items: ShellItem[];
  active: string;
  user: ShellUser;
  sidebarName: string;
  onSignOut: () => void;
  topbar?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Close the menu after navigating.
  useEffect(() => {
    setOpen(false);
  }, [active]);

  return (
    <div className="admin-app">
      <div className="admin-frame">
        <aside className={`admin-side${open ? " is-open" : ""}`}>
          <div className="admin-brand-row">
            <a className="admin-brand" href={brandHref} aria-label={brandLabel}>
              <span className="admin-brand-top"><LotusIcon /><strong>Aisha</strong></span>
              <small>ACADEMIA ONLINE DE MEDIUMNIDAD</small>
            </a>
            <button
              type="button"
              className="shell-toggle"
              aria-expanded={open}
              aria-controls="shell-menu"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
          <div className="shell-menu" id="shell-menu">
            <nav aria-label={navLabel}>
              {items.map(({ id, href, label, icon: Icon }) => (
                <a key={id} href={href} className={active === id ? "active" : undefined} aria-current={active === id ? "page" : undefined}>
                  <Icon size={20} strokeWidth={1.7} aria-hidden="true" /> {label}
                </a>
              ))}
            </nav>
            <div className="admin-user">
              <div className="admin-user-row">
                <Avatar name={user.name} src={user.avatar} className="admin-avatar" />
                <div>
                  <strong>{sidebarName}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <button type="button" onClick={onSignOut}><LogOut size={16} aria-hidden="true" /> Cerrar sesión</button>
            </div>
          </div>
        </aside>

        <div className="admin-body">
          <header className="admin-topbar">
            {topbar}
            <a className="admin-site-link" href="#inicio"><ExternalLink size={16} aria-hidden="true" /> Ver sitio</a>
            <div className="admin-me">
              <Avatar name={user.name} src={user.avatar} className="admin-avatar" />
              <div>
                <strong>{user.name}</strong>
                <span>{user.roleLabel}</span>
              </div>
            </div>
          </header>
          <div className="admin-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
