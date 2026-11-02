import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { messageOf, type AccessState, type ContentType, type Publication } from "../lib/access";

// Loads data with an async function and exposes loading / error / reload.
// Previous data stays on screen while a reload is in flight, so lists do not flicker.
export function useLoad<T>(loader: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));
    loader()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: messageOf(error) });
      });
    return () => {
      cancelled = true;
    };
    // The loader closes over the values listed in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((value) => value + 1) };
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const typeLabel = (type: ContentType) => (type === "workshop" ? "Taller" : "Curso");

const publicationLabels: Record<Publication, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

const accessLabels: Record<AccessState, string> = {
  active: "Acceso activo",
  revoked: "Acceso revocado",
  none: "Sin acceso",
};

export function PublicationBadge({ status }: { status: Publication }) {
  return <span className={`badge badge-pub-${status}`}>{publicationLabels[status]}</span>;
}

export function AccessBadge({ status }: { status: AccessState }) {
  return <span className={`badge badge-access-${status}`}>{accessLabels[status]}</span>;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <nav className="pager" aria-label="Paginación">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Página anterior">
        <ChevronLeft size={18} />
      </button>
      <span>Página {page} de {pages}</span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Página siguiente">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}

export function LoadState({
  loading,
  error,
  onRetry,
  empty,
  hasData,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  empty?: string;
  hasData: boolean;
  children: ReactNode;
}) {
  if (error) {
    return (
      <div className="state-box state-error" role="alert">
        <p>{error}</p>
        <button className="button button-small button-outline" type="button" onClick={onRetry}>Reintentar</button>
      </div>
    );
  }
  if (loading && !hasData) {
    return <div className="state-box" role="status" aria-busy="true"><span className="spinner" aria-hidden="true" /> Cargando…</div>;
  }
  if (!hasData && empty) return <div className="state-box"><p>{empty}</p></div>;
  return <>{children}</>;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Accessible dialog: focus moves in, Tab stays inside, Escape closes, focus returns to the opener.
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className={`modal${wide ? " modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={ref}
        onKeyDown={onKeyDown}
      >
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  danger,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={busy ? () => undefined : onCancel}>
      <div className="modal-body confirm-body">{children}</div>
      {error && <p className="form-alert modal-alert" role="alert">{error}</p>}
      <footer className="modal-foot">
        <button type="button" className="button button-outline" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="button" className={`button${danger ? " button-danger" : ""}`} onClick={onConfirm} disabled={busy}>
          {busy ? "Guardando…" : confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}

