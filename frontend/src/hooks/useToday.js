"use client";

import { useSyncExternalStore } from "react";
import { toISODate } from "@/lib/format";

const subscribe = () => () => {};

/**
 * Fecha de hoy (YYYY-MM-DD) del navegador. Devuelve "" en el servidor / durante la hidratación,
 * así el HTML estático (generado en build) nunca queda con una fecha vieja.
 */
export function useToday() {
  return useSyncExternalStore(subscribe, () => toISODate(new Date()), () => "");
}
