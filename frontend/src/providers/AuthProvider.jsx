"use client";

import { createContext, use, useCallback, useMemo, useSyncExternalStore } from "react";
import { tokenStorage } from "@api/utils";
import { getSession, login as loginRequest, logout as logoutRequest } from "@entity/auth";
import { useQuery } from "@/hooks/useQuery";

const AuthContext = createContext(null);

const subscribeNoop = () => () => {};
const getServerToken = () => null;

/**
 * Sesión del usuario. Expone `{ user, status, login, logout }`.
 * status: "loading" | "authenticated" | "unauthenticated".
 * Es el único punto que conoce el ciclo de vida del token; los demás consumen `useAuth()`.
 */
export function AuthProvider({ children }) {
  const isHydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const token = useSyncExternalStore(tokenStorage.subscribe, tokenStorage.get, getServerToken);

  const session = useQuery(["session", token], getSession, { enabled: Boolean(token) });

  const status = !isHydrated
    ? "loading"
    : !token || session.error
      ? "unauthenticated"
      : session.data && !session.isFetching
        ? "authenticated"
        : "loading";

  const login = useCallback((credentials) => loginRequest(credentials), []);
  const logout = useCallback(() => logoutRequest(), []);

  const value = useMemo(
    () => ({ user: status === "authenticated" ? session.data : null, status, login, logout }),
    [status, session.data, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return context;
}
