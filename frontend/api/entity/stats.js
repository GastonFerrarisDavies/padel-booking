import { http } from "@api/utils";

/**
 * Servicio de dominio: métricas del dashboard.
 *
 * @typedef {{ revenue: number, revenueDelta: number, bookings: number, bookingsDelta: number,
 *   occupancy: number, occupancyDelta: number, newUsers: number, newUsersDelta: number,
 *   revenueByDay: Array<{ date: string, value: number }> }} DashboardStats
 */

/**
 * Cada microservicio expone las métricas de su dominio; acá se combinan.
 * `date` es el "hoy" del navegador (YYYY-MM-DD): el backend no conoce la zona horaria del club.
 *
 * @param {{ date: string }} params
 * @returns {Promise<DashboardStats>}
 */
export async function getDashboardStats({ date }, { signal } = {}) {
  const [bookings, courts, users] = await Promise.all([
    http.get("/bookings/stats", { signal, params: { date } }),
    http.get("/courts/occupancy", { signal, params: { date } }),
    http.get("/users/stats", { signal }),
  ]);
  return {
    revenue: bookings.revenue,
    revenueDelta: bookings.revenueDelta,
    bookings: bookings.bookings,
    bookingsDelta: bookings.bookingsDelta,
    revenueByDay: bookings.revenueByDay,
    occupancy: courts.occupancy,
    occupancyDelta: courts.occupancyDelta,
    newUsers: users.newUsers,
    newUsersDelta: users.newUsersDelta,
  };
}
