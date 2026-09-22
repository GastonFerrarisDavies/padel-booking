/**
 * Backend en memoria para desarrollo sin servidor (NEXT_PUBLIC_API_MOCK=true).
 * Solo lo carga `api/utils.jsx` mediante import dinámico; la UI no lo conoce.
 * Se resetea al recargar la página.
 */

const LATENCY_MS = 250;
const OPENING_HOUR = 8;
const CLOSING_HOUR = 23;

/* ------------------------------ helpers de fecha ------------------------------ */

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const offsetDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
};
const toMinutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const toHHMM = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const hash = (text) => {
  let h = [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  h = Math.imul(h ^ (h >>> 15), 2246822507); // avalancha: cadenas parecidas → valores distintos
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
};

/* ---------------------------------- seeds ------------------------------------ */

const db = {
  courts: [
    { id: "c1", name: "Cancha 1 · Central", surface: "CRISTAL", indoor: true, pricePerHour: 18000, status: "ACTIVE", rating: 4.9, reviewsCount: 312 },
    { id: "c2", name: "Cancha 2 · Panorámica", surface: "CRISTAL", indoor: false, pricePerHour: 16000, status: "ACTIVE", rating: 4.8, reviewsCount: 241 },
    { id: "c3", name: "Cancha 3 · Sintético", surface: "SINTETICO", indoor: false, pricePerHour: 12000, status: "ACTIVE", rating: 4.6, reviewsCount: 187 },
    { id: "c4", name: "Cancha 4 · Indoor Pro", surface: "CRISTAL", indoor: true, pricePerHour: 20000, status: "ACTIVE", rating: 5, reviewsCount: 96 },
    { id: "c5", name: "Cancha 5 · Cemento", surface: "CEMENTO", indoor: false, pricePerHour: 9000, status: "MAINTENANCE", rating: 4.3, reviewsCount: 74 },
    { id: "c6", name: "Cancha 6 · Sintético", surface: "SINTETICO", indoor: true, pricePerHour: 13000, status: "ACTIVE", rating: 4.7, reviewsCount: 133 },
  ],
  users: [
    { id: "u1", name: "Gastón Ferraris", email: "admin@padel.com", role: "OWNER", active: true, createdAt: "2025-11-02" },
    { id: "u2", name: "Lucía Herrera", email: "lucia@padel.com", role: "ADMIN", active: true, createdAt: "2026-01-14" },
    { id: "u3", name: "Martín Acosta", email: "martin@correo.com", role: "PLAYER", active: true, createdAt: "2026-03-08" },
    { id: "u4", name: "Sofía Benítez", email: "sofia@correo.com", role: "PLAYER", active: true, createdAt: "2026-04-21" },
    { id: "u5", name: "Diego Paredes", email: "diego@correo.com", role: "PLAYER", active: false, createdAt: "2026-05-30" },
    { id: "u6", name: "Camila Ríos", email: "camila@correo.com", role: "PLAYER", active: true, createdAt: "2026-07-11" },
  ],
  bookings: [],
};

const PLAYERS = ["Martín Acosta", "Sofía Benítez", "Camila Ríos", "Nicolás Vega", "Julieta Mora", "Franco Ledesma"];

(function seedBookings() {
  let seq = 1;
  for (let day = -2; day <= 3; day++) {
    for (const court of db.courts.filter((c) => c.status === "ACTIVE")) {
      for (let hour = OPENING_HOUR; hour < CLOSING_HOUR - 1; hour++) {
        const date = offsetDate(day);
        if (hash(`${court.id}${date}${hour}`) % 100 > 38) continue;
        const start = toHHMM(hour * 60);
        db.bookings.push({
          id: `b${seq++}`,
          courtId: court.id,
          courtName: court.name,
          playerName: PLAYERS[hash(`${court.id}${date}${hour}p`) % PLAYERS.length],
          date,
          startTime: start,
          endTime: toHHMM(hour * 60 + 90),
          status: day < 0 || hash(`${date}${hour}s`) % 9 ? "CONFIRMED" : "PENDING",
          price: court.pricePerHour * 1.5,
        });
        hour += 1; // evita solapar con la siguiente hora
      }
    }
  }
})();

/* --------------------------------- errores ---------------------------------- */

const ok = (payload, status = 200) => ({ status, payload });
const fail = (status, message) => ({ status, payload: { message } });

/* ---------------------------------- rutas ------------------------------------ */

const userFromToken = (ctx) => {
  const token = ctx.headers.get("Authorization")?.replace("Bearer ", "");
  return db.users.find((u) => `mock-${u.id}` === token) ?? null;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

function slotsFor(court, { date, time, duration }) {
  const length = Number(duration) || 90;
  const minStart = time ? toMinutes(time) : 0;
  const now = new Date();
  const nowMinutes = date === isoDate(now) ? now.getHours() * 60 + now.getMinutes() : -1;
  const taken = db.bookings.filter((b) => b.courtId === court.id && b.date === date && b.status !== "CANCELLED");
  const slots = [];
  for (let start = OPENING_HOUR * 60; start + length <= CLOSING_HOUR * 60; start += 60) {
    if (start < minStart || start <= nowMinutes) continue;
    const busy = taken.some((b) => overlaps(start, start + length, toMinutes(b.startTime), toMinutes(b.endTime)));
    if (busy) continue;
    slots.push({ start: toHHMM(start), end: toHHMM(start + length), price: Math.round((court.pricePerHour * length) / 60) });
  }
  return slots;
}

const routes = [
  ["POST", "/auth/login", (ctx) => {
    const { email, password } = ctx.body ?? {};
    const user = db.users.find((u) => u.email === email?.trim().toLowerCase());
    if (!user || password !== "admin123") return fail(401, "Email o contraseña incorrectos.");
    if (!user.active) return fail(403, "Tu cuenta está desactivada.");
    return ok({ token: `mock-${user.id}`, user });
  }],
  ["GET", "/auth/me", (ctx) => {
    const user = userFromToken(ctx);
    return user ? ok(user) : fail(401, "Sesión expirada.");
  }],

  ["GET", "/courts/availability", (ctx) => {
    const { date, surface, time, duration } = ctx.params ?? {};
    const courts = db.courts
      .filter((c) => c.status === "ACTIVE" && (!surface || c.surface === surface))
      .map((c) => ({ ...c, availableSlots: slotsFor(c, { date, time, duration }) }))
      .filter((c) => c.availableSlots.length > 0);
    return ok(courts);
  }],
  ["GET", "/courts", (ctx) => ok(db.courts.filter((c) => !ctx.params?.status || c.status === ctx.params.status))],
  ["POST", "/courts", (ctx) => {
    const court = { rating: 0, reviewsCount: 0, status: "ACTIVE", ...ctx.body, id: `c${Date.now()}` };
    db.courts.push(court);
    return ok(court, 201);
  }],
  ["GET", "/courts/:id", (_ctx, { id }) => {
    const court = db.courts.find((c) => c.id === id);
    return court ? ok(court) : fail(404, "La cancha no existe.");
  }],
  ["PUT", "/courts/:id", (ctx, { id }) => {
    const index = db.courts.findIndex((c) => c.id === id);
    if (index < 0) return fail(404, "La cancha no existe.");
    db.courts[index] = { ...db.courts[index], ...ctx.body, id };
    return ok(db.courts[index]);
  }],
  ["DELETE", "/courts/:id", (_ctx, { id }) => {
    db.courts = db.courts.filter((c) => c.id !== id);
    return ok(null, 204);
  }],

  ["GET", "/bookings", (ctx) => {
    const { date, courtId } = ctx.params ?? {};
    return ok(db.bookings.filter((b) => (!date || b.date === date) && (!courtId || b.courtId === courtId)));
  }],
  ["POST", "/bookings", (ctx) => {
    const { courtId, date, startTime, endTime, playerName } = ctx.body ?? {};
    const court = db.courts.find((c) => c.id === courtId);
    if (!court) return fail(404, "La cancha no existe.");
    const clash = db.bookings.some(
      (b) => b.courtId === courtId && b.date === date && b.status !== "CANCELLED" &&
        overlaps(toMinutes(startTime), toMinutes(endTime), toMinutes(b.startTime), toMinutes(b.endTime)),
    );
    if (clash) return fail(409, "Ese horario acaba de ser reservado. Elegí otro.");
    const price = Math.round((court.pricePerHour * (toMinutes(endTime) - toMinutes(startTime))) / 60);
    const booking = { id: `b${Date.now()}`, courtId, courtName: court.name, playerName, date, startTime, endTime, status: "CONFIRMED", price };
    db.bookings.push(booking);
    return ok(booking, 201);
  }],
  ["PATCH", "/bookings/:id", (ctx, { id }) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) return fail(404, "La reserva no existe.");
    Object.assign(booking, ctx.body);
    return ok(booking);
  }],

  ["GET", "/users", (ctx) => {
    const { role, search } = ctx.params ?? {};
    const term = search?.toLowerCase();
    return ok(db.users.filter((u) =>
      (!role || u.role === role) && (!term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)),
    ));
  }],
  ["PATCH", "/users/:id", (ctx, { id }) => {
    const user = db.users.find((u) => u.id === id);
    if (!user) return fail(404, "El usuario no existe.");
    Object.assign(user, ctx.body);
    return ok(user);
  }],

  ["GET", "/dashboard/stats", () => {
    const today = offsetDate(0);
    const confirmed = db.bookings.filter((b) => b.status !== "CANCELLED");
    const revenueByDay = Array.from({ length: 14 }, (_, i) => {
      const date = offsetDate(i - 13);
      const real = confirmed.filter((b) => b.date === date).reduce((sum, b) => sum + b.price, 0);
      return { date, value: real || 90000 + (hash(date) % 160000) };
    });
    const sum = (rows) => rows.reduce((acc, r) => acc + r.value, 0);
    const revenue = sum(revenueByDay.slice(7));
    const previous = sum(revenueByDay.slice(0, 7));
    const activeCourts = db.courts.filter((c) => c.status === "ACTIVE").length;
    const todayBookings = confirmed.filter((b) => b.date === today).length;
    return ok({
      revenue,
      revenueDelta: Math.round(((revenue - previous) / previous) * 1000) / 10,
      bookings: confirmed.length,
      bookingsDelta: 8.4,
      occupancy: Math.min(98, Math.round((todayBookings / Math.max(activeCourts * 7, 1)) * 100)),
      occupancyDelta: 3.1,
      newUsers: db.users.filter((u) => u.role === "PLAYER").length,
      newUsersDelta: -1.8,
      revenueByDay,
    });
  }],
];

/* -------------------------------- dispatcher ---------------------------------- */

function match(pattern, path) {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) params[patternParts[i].slice(1)] = pathParts[i];
    else if (patternParts[i] !== pathParts[i]) return null;
  }
  return params;
}

/** @param {{ method: string, path: string, params?: object, body?: any, headers: Headers }} ctx */
export async function mockRequest(ctx) {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  const isPublic =
    ctx.path === "/auth/login" ||
    (ctx.method === "GET" && ctx.path.startsWith("/courts")) ||
    (ctx.method === "POST" && ctx.path === "/bookings");
  if (!isPublic && !userFromToken(ctx)) return fail(401, "Necesitás iniciar sesión.");

  for (const [method, pattern, handler] of routes) {
    if (method !== ctx.method) continue;
    const params = match(pattern, ctx.path);
    if (params) return handler(ctx, params);
  }
  return fail(404, `Ruta no encontrada: ${ctx.method} ${ctx.path}`);
}
