import { http } from "@api/utils";

/**
 * Servicio de dominio: autorización de la sesión.
 * La autenticación (login, registro, logout) la resuelve Clerk; el backend solo
 * devuelve el rol y el estado del usuario guardados en user-service.
 *
 * @typedef {{ id: string, role: "OWNER"|"ADMIN"|"PLAYER", active: boolean, createdAt: string }} Access
 */

/** @returns {Promise<Access>} 401 sin sesión válida · 403 cuenta deshabilitada. */
export function getAccess(options) {
  return http.get("/auth/me", options);
}
