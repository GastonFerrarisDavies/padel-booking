"use client";

import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import { getAvailableCourts } from "@entity/court";
import { useQuery } from "@/hooks/useQuery";
import { useToday } from "@/hooks/useToday";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatLongDate } from "@/lib/format";
import { AvailabilitySearch } from "./AvailabilitySearch";
import { BookingDialog } from "./BookingDialog";
import { CourtCard } from "./CourtCard";
import { SlotList } from "./SlotList";

const INITIAL_FILTERS = { date: "", time: "", duration: 90, surface: "" };

/**
 * Sección "buscar y reservar" de la home (Client Component).
 * Es dueña del estado compartido entre el buscador, la grilla de canchas y el diálogo de reserva.
 * Los datos se piden en el navegador: la disponibilidad no puede congelarse en el build estático.
 */
export function BookingExplorer() {
  const today = useToday();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selection, setSelection] = useState(null); // { court, slot }

  const date = filters.date || today;
  const availability = useQuery(
    ["availability", date, filters.time, filters.duration, filters.surface],
    ({ signal }) => getAvailableCourts({ ...filters, date }, { signal }),
    { enabled: Boolean(date) },
  );

  return (
    <section id="canchas" className="scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AvailabilitySearch
          key={JSON.stringify(filters)} // remonta para sincronizar el borrador al aplicar/resetear filtros
          initialFilters={filters}
          today={today}
          loading={availability.isFetching}
          onSearch={setFilters}
        />

        <div className="mt-14 mb-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Canchas <span className="text-brand-500">libres</span>
            {date && <span className="block text-lg font-medium text-slate-400 sm:inline sm:pl-3 sm:text-xl">{formatLongDate(date)}</span>}
          </h2>
        </div>

        {date ? (
          <QueryBoundary
            query={availability}
            skeleton={<CourtGridSkeleton />}
            empty={
              <EmptyState
                icon={CalendarX2}
                title="No hay canchas libres con esos filtros"
                description="Probá con otro horario, otra duración o quitá el filtro de superficie."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
                    Ver todo el día
                  </Button>
                }
              />
            }
          >
            {(courts) => (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courts.map((court) => (
                  <li key={court.id}>
                    <CourtCard
                      court={court}
                      footer={
                        <Button className="w-full" onClick={() => setSelection({ court, slot: court.availableSlots[0] })}>
                          Reservar {court.availableSlots[0].start}
                        </Button>
                      }
                    >
                      <SlotList slots={court.availableSlots} onSelect={(slot) => setSelection({ court, slot })} />
                    </CourtCard>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        ) : (
          <CourtGridSkeleton />
        )}
      </div>

      <BookingDialog
        selection={selection}
        date={date}
        onClose={() => setSelection(null)}
        onBooked={availability.refetch}
      />
    </section>
  );
}

function CourtGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-96 rounded-2xl" />
      ))}
    </div>
  );
}
