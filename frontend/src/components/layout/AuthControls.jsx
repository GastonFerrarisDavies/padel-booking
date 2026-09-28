"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { ADMIN_ROLES } from "@/lib/constants";

/**
 * Controles de sesión del header: ingresar / crear cuenta sin sesión;
 * acceso al panel (solo Owner/Admin) y menú de usuario de Clerk con sesión.
 */
export function AuthControls() {
  const { user } = useAuth();
  const canUseDashboard = user && ADMIN_ROLES.includes(user.role);

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm" leadingIcon={<LogIn className="size-4" />}>
            Ingresar
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="secondary" size="sm" leadingIcon={<UserPlus className="size-4" />} className="max-sm:hidden">
            Crear cuenta
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        {canUseDashboard && (
          <Button href="/dashboard" variant="ghost" size="sm" leadingIcon={<LayoutDashboard className="size-4" />} className="max-sm:hidden">
            Panel
          </Button>
        )}
        <UserButton />
      </Show>
    </>
  );
}
