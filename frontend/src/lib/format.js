import { CURRENCY, LOCALE } from "@/config/site";

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

export const formatCurrency = (value) => currencyFormatter.format(value ?? 0);

/** Compacta cifras grandes: 1.250.000 → "1,3 M". */
export const formatCompact = (value) =>
  new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 }).format(value ?? 0);

const pad = (n) => String(n).padStart(2, "0");

/** Fecha LOCAL → "YYYY-MM-DD" (no usar toISOString: convierte a UTC). */
export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" → Date local a las 00:00. */
export function parseISODate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** "2026-09-21" → "lun 21 sep". */
export function formatShortDate(iso) {
  return new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short" })
    .format(parseISODate(iso))
    .replace(/\./g, "");
}

/** "2026-09-21" → "Lunes, 21 de septiembre". */
export function formatLongDate(iso) {
  const text = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long" }).format(parseISODate(iso));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const minutesOf = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
