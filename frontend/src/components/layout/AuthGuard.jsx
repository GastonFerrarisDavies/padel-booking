"use client";

import { RedirectToSignIn } from "@clerk/react";
import { ShieldAlert, UserRoundX } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";

function Centered({ children }) {
  return <div className="flex min-h-screen items-center justify-center p-6">{children}</div>;
}

/**
 * Protege un árbol de UI por sesión (Clerk) y rol (user-service).
 * OJO: con `output: 'export'` no hay middleware, así que esto es solo UX.
 * La autorización real la impone el backend (401/403).
 */
export function AuthGuard({ roles, children }) {
  const { user, status, error, retry, logout } = useAuth();

  if (status === "unauthenticated") return <RedirectToSignIn />;

  if (status === "loading") {
    return (
      <Centered>
        <Spinner className="size-8 text-brand-500" label="Verificando sesión" />
      </Centered>
    );
  }

  const logoutButton = (
    <Button variant="secondary" onClick={logout}>
      Cerrar sesión
    </Button>
  );

  if (status === "error") {
    return (
      <Centered>
        <ErrorState error={error} onRetry={retry} className="w-full max-w-md" />
      </Centered>
    );
  }

  if (status === "disabled") {
    return (
      <Centered>
        <EmptyState
          icon={UserRoundX}
          title="Tu cuenta está deshabilitada"
          description="Un administrador del club desactivó tu acceso. Contactalo para reactivarlo."
          action={logoutButton}
        />
      </Centered>
    );
  }

  if (!roles.includes(user.role)) {
    return (
      <Centered>
        <EmptyState
          icon={ShieldAlert}
          title="No tenés permisos para ver esta sección"
          description="Necesitás un rol de Owner o Admin. Pedile acceso al dueño del club."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button href="/">Volver al sitio</Button>
              {logoutButton}
            </div>
          }
        />
      </Centered>
    );
  }

  return children;
}
