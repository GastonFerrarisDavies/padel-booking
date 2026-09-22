import { http } from "@api/utils";

/**
 * Servicio de dominio: canchas.
 * Todas las funciones aceptan `{ signal }` para poder cancelar la petición.
 *
 * @typedef {{ id: string, name: string, surface: "CRISTAL"|"CEMENTO"|"SINTETICO", indoor: boolean,
 *   pricePerHour: number, status: "ACTIVE"|"MAINTENANCE"|"INACTIVE", rating: number, reviewsCount: number }} Court
 * @typedef {{ start: string, end: string, price: number }} Slot
 * @typedef {Court & { availableSlots: Slot[] }} AvailableCourt
 */

/** @returns {Promise<Court[]>} */
export function getCourts({ status } = {}, options) {
  return http.get("/courts", { ...options, params: { status } });
}

/** @returns {Promise<Court>} */
export function getCourtById(id, options) {
  return http.get(`/courts/${id}`, options);
}

/**
 * Canchas libres para una fecha (y opcionalmente hora, duración y superficie).
 * @param {{ date: string, time?: string, duration?: number|string, surface?: string }} filters
 * @returns {Promise<AvailableCourt[]>}
 */
export function getAvailableCourts({ date, time, duration, surface }, options) {
  return http.get("/courts/availability", { ...options, params: { date, time, duration, surface } });
}

/** @param {Pick<Court, "name"|"surface"|"indoor"|"pricePerHour"|"status">} data */
export function createCourt(data) {
  return http.post("/courts", data);
}

/** @param {Partial<Court>} data */
export function updateCourt(id, data) {
  return http.put(`/courts/${id}`, data);
}

export function setCourtStatus(id, status) {
  return http.put(`/courts/${id}`, { status });
}

export function deleteCourt(id) {
  return http.delete(`/courts/${id}`);
}
