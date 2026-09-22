"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Protege un árbol de UI por sesión y rol.
 * OJO: con `output: 'export'` no hay middleware, así que esto es solo UX.
 * La autorización real la impone el backend (401/403).
 */
export function AuthGuard({ roles, children }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-brand-500" label="Verificando sesión" />
      </div>
    );
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <EmptyState
          icon={ShieldAlert}
          title="No tenés permisos para ver esta sección"
          description="Necesitás un rol de Owner o Admin. Pedile acceso al dueño del club."
          action={
            <Button variant="secondary" onClick={logout}>
              Cerrar sesión
            </Button>
          }
        />
      </div>
    );
  }

  return children;
}
