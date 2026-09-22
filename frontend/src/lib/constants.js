export const ROLES = { OWNER: "OWNER", ADMIN: "ADMIN", PLAYER: "PLAYER" };

/** Roles con acceso al dashboard. */
export const ADMIN_ROLES = [ROLES.OWNER, ROLES.ADMIN];

export const ROLE_LABELS = { OWNER: "Owner", ADMIN: "Admin", PLAYER: "Jugador" };

export const SURFACES = { CRISTAL: "Cristal", CEMENTO: "Cemento", SINTETICO: "Sintético" };

export const COURT_STATUS = { ACTIVE: "Activa", MAINTENANCE: "Mantenimiento", INACTIVE: "Inactiva" };
export const COURT_STATUS_TONE = { ACTIVE: "success", MAINTENANCE: "warning", INACTIVE: "neutral" };

export const BOOKING_STATUS = { CONFIRMED: "Confirmada", PENDING: "Pendiente", CANCELLED: "Cancelada" };
export const BOOKING_STATUS_TONE = { CONFIRMED: "success", PENDING: "warning", CANCELLED: "danger" };

/** Horario de operación mostrado en grillas y buscador. */
export const OPENING_HOUR = 8;
export const CLOSING_HOUR = 23;

export const DURATIONS = [
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "120 min" },
];
