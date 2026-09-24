import { http, tokenStorage } from "@api/utils";

/**
 * Servicio de dominio: sesión.
 * Es el único que persiste/borra el token (vía `tokenStorage` de api/utils).
 */

/**
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<import("./user").User>}
 */
export async function login({ email, password }) {
  const { token, user } = await http.post("/users/auth/login", { email, password });
  tokenStorage.set(token);
  return user;
}

export function logout() {
  tokenStorage.clear();
}

/** Usuario de la sesión actual (401 => el interceptor limpia el token). */
export function getSession(options) {
  return http.get("/users/auth/me", options);
}
