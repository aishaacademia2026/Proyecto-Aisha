import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Lock } from "lucide-react";

// Pages that need a signed-in visitor. The server still decides what each person may see.
export function AuthGate({
  ready,
  session,
  onSignIn,
  isSigningIn,
  title,
  children,
}: {
  ready: boolean;
  session: Session | null;
  onSignIn: () => void;
  isSigningIn: boolean;
  title: string;
  children: ReactNode;
}) {
  if (!ready) return <div className="member-page"><div className="member-wrap"><div className="state-box" role="status"><span className="spinner" aria-hidden="true" /> Cargando…</div></div></div>;
  if (!session) {
    return (
      <div className="member-page">
        <div className="member-wrap">
          <div className="gate-card">
            <Lock size={34} strokeWidth={1.4} aria-hidden="true" />
            <h1>{title}</h1>
            <p>Inicia sesión con tu cuenta de Google para continuar.</p>
            <button className="button" type="button" onClick={onSignIn} disabled={isSigningIn}>
              {isSigningIn ? "Conectando…" : "Iniciar sesión"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
