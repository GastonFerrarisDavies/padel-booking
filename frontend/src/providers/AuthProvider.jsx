"use client";

import { createContext, use, useCallback, useMemo } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/react";
import { getAccess } from "@api/entity/auth";
import { useQuery } from "@/hooks/useQuery";

const AuthContext = createContext(null);

/**
 * Sesión del usuario: identidad desde Clerk + autorización (rol, activo) desde user-service.
 * Expone `{ user, status, error, retry, logout }`.
 * status: "loading" | "unauthenticated" | "authenticated" | "disabled" | "error".
 * Debe renderizarse dentro de <ClerkProvider>.
 */
export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, userId, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();

  const access = useQuery(["access", userId], getAccess, { enabled: Boolean(isSignedIn) });

  const status = !isLoaded
    ? "loading"
    : !isSignedIn
      ? "unauthenticated"
      : access.error
        ? access.error.isForbidden
          ? "disabled"
          : "error"
        : access.data?.id === userId && !access.isFetching && clerkUser
          ? "authenticated"
          : "loading";

  const logout = useCallback(() => signOut({ redirectUrl: "/" }), [signOut]);

  const user = useMemo(() => {
    if (status !== "authenticated") return null;
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
    return {
      ...access.data,
      name: clerkUser.fullName || clerkUser.username || email,
      email,
      imageUrl: clerkUser.imageUrl,
    };
  }, [status, access.data, clerkUser]);

  const value = useMemo(
    () => ({ user, status, error: access.error, retry: access.refetch, logout }),
    [user, status, access.error, access.refetch, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return context;
}
