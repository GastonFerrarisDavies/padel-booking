import { http } from "@api/utils";

/**
 * Servicio de dominio: reservas.
 *
 * @typedef {{ id: string, courtId: string, courtName: string, playerName: string, date: string,
 *   startTime: string, endTime: string, status: "CONFIRMED"|"PENDING"|"CANCELLED", price: number }} Booking
 */

/** @returns {Promise<Booking[]>} */
export function getBookings({ date, courtId } = {}, options) {
  return http.get("/bookings", { ...options, params: { date, courtId } });
}

/**
 * @param {{ courtId: string, date: string, startTime: string, endTime: string, playerName: string, playerContact?: string }} data
 * @returns {Promise<Booking>}
 */
export function createBooking(data) {
  return http.post("/bookings", data);
}

export function updateBookingStatus(id, status) {
  return http.patch(`/bookings/${id}`, { status });
}

export function cancelBooking(id) {
  return updateBookingStatus(id, "CANCELLED");
}
