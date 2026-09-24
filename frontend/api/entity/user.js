import { http } from "@api/utils";

/**
 * Servicio de dominio: administración de usuarios.
 *
 * @typedef {{ id: string, name: string, email: string, role: "OWNER"|"ADMIN"|"PLAYER",
 *   active: boolean, createdAt: string }} User
 */

/** @returns {Promise<User[]>} */
export function getUsers({ role, search } = {}, options) {
  return http.get("/users", { ...options, params: { role, search } });
}

export function updateUserRole(id, role) {
  return http.patch(`/users/${id}`, { role });
}

export function setUserActive(id, active) {
  return http.patch(`/users/${id}`, { active });
}
