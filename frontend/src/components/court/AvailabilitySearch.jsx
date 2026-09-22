"use client";

import { useState } from "react";
import { CalendarDays, Clock, Layers, Search, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { CLOSING_HOUR, DURATIONS, OPENING_HOUR, SURFACES } from "@/lib/constants";

const HOURS = Array.from({ length: CLOSING_HOUR - OPENING_HOUR }, (_, i) => `${String(OPENING_HOUR + i).padStart(2, "0")}:00`);

/**
 * Buscador de disponibilidad. Mantiene un borrador local y lo publica con `onSearch(filters)` al enviar.
 * `today` (YYYY-MM-DD) es el valor por defecto de la fecha y su mínimo.
 */
export function AvailabilitySearch({ initialFilters, today, loading, onSearch }) {
  const [draft, setDraft] = useState(initialFilters);
  const update = (field) => (event) => setDraft((prev) => ({ ...prev, [field]: event.target.value }));

  function handleSubmit(event) {
    event.preventDefault();
    onSearch({ ...draft, date: draft.date || today });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:grid-cols-2 sm:p-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-end"
    >
      <Field label="Fecha">
        <Input type="date" required min={today} value={draft.date || today} onChange={update("date")} leadingIcon={<CalendarDays />} />
      </Field>
      <Field label="Desde las">
        <div className="relative">
          <Clock className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-500" />
          <Select value={draft.time} onChange={update("time")} className="pl-10">
            <option value="">Cualquier hora</option>
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </Select>
        </div>
      </Field>
      <Field label="Duración">
        <div className="relative">
          <Timer className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-500" />
          <Select value={draft.duration} onChange={update("duration")} className="pl-10">
            {DURATIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </Field>
      <Field label="Superficie">
        <div className="relative">
          <Layers className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-500" />
          <Select value={draft.surface} onChange={update("surface")} className="pl-10">
            <option value="">Todas</option>
            {Object.entries(SURFACES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </Field>
      <Button type="submit" size="lg" loading={loading} leadingIcon={<Search className="size-5" />} className="sm:col-span-2 lg:col-span-1">
        Buscar
      </Button>
    </form>
  );
}
