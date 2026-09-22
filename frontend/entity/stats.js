import { http } from "@api/utils";

/**
 * Servicio de dominio: métricas del dashboard.
 *
 * @typedef {{ revenue: number, revenueDelta: number, bookings: number, bookingsDelta: number,
 *   occupancy: number, occupancyDelta: number, newUsers: number, newUsersDelta: number,
 *   revenueByDay: Array<{ date: string, value: number }> }} DashboardStats
 */

/** @returns {Promise<DashboardStats>} */
export function getDashboardStats(options) {
  return http.get("/dashboard/stats", options);
}
