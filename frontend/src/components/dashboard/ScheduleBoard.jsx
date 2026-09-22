"use client";

import { useState } from "react";
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react";
import { cancelBooking, getBookings } from "@entity/booking";
import { getCourts } from "@entity/court";
import { useMutation } from "@/hooks/useMutation";
import { useQuery } from "@/hooks/useQuery";
import { useToday } from "@/hooks/useToday";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { CLOSING_HOUR, OPENING_HOUR } from "@/lib/constants";
import { addDays, formatLongDate, initials, minutesOf } from "@/lib/format";
import { BookingsTable } from "./BookingsTable";

const HOURS = Array.from({ length: CLOSING_HOUR - OPENING_HOUR }, (_, i) => OPENING_HOUR + i);
const GRID_COLUMNS = { gridTemplateColumns: `10rem repeat(${HOURS.length}, minmax(3rem, 1fr))` };

const overlapsHour = (booking, hour) => minutesOf(booking.startTime) < (hour + 1) * 60 && minutesOf(booking.endTime) > hour * 60;

/** Vista "Horarios": grilla canchas × horas del día + listado de reservas con cancelación. */
export function ScheduleBoard() {
  const today = useToday();
  const [picked, setPicked] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const date = picked || today;

  const courts = useQuery(["courts"], ({ signal }) => getCourts({}, { signal }));
  const bookings = useQuery(["bookings", date], ({ signal }) => getBookings({ date }, { signal }), { enabled: Boolean(date) });
  const cancel = useMutation(cancelBooking);

  const activeBookings = (bookings.data ?? []).filter((booking) => booking.status !== "CANCELLED");

  async function handleCancel() {
    try {
      await cancel.mutate(cancelling.id);
      setCancelling(null);
      bookings.refetch();
    } catch {
      /* se muestra en el diálogo */
    }
  }

  return (
    <>
      <PageHeader
        title="Horarios"
        description={date ? formatLongDate(date) : "Cargando fecha…"}
        actions={
          <>
            <Button variant="secondary" size="icon" aria-label="Día anterior" disabled={!date} onClick={() => setPicked(addDays(date, -1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="w-44">
              <Input type="date" aria-label="Fecha" value={date} onChange={(event) => setPicked(event.target.value)} />
            </div>
            <Button variant="secondary" size="icon" aria-label="Día siguiente" disabled={!date} onClick={() => setPicked(addDays(date, 1))}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPicked("")}>
              Hoy
            </Button>
          </>
        }
      />

      <Card className="p-4 sm:p-5">
        <QueryBoundary
          query={courts}
          skeleton={<Skeleton className="h-72" />}
          empty={<EmptyState title="No hay canchas cargadas" description="Creá canchas para ver su ocupación." />}
        >
          {(courtList) => (
            <div className={cn("transition-opacity", bookings.isFetching && "opacity-60")}>
              {bookings.error && <ErrorState error={bookings.error} onRetry={bookings.refetch} className="mb-4" />}
              <div className="overflow-x-auto">
                <div className="grid min-w-max gap-1" style={GRID_COLUMNS} role="table" aria-label="Ocupación por cancha y hora">
                  <div />
                  {HOURS.map((hour) => (
                    <div key={hour} className="pb-1 text-center text-xs text-slate-500">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                  {courtList.map((court) => (
                    <CourtRow key={court.id} court={court} bookings={activeBookings.filter((b) => b.courtId === court.id)} />
                  ))}
                </div>
              </div>
              <Legend />
            </div>
          )}
        </QueryBoundary>
      </Card>

      <Card className="mt-6">
        <Card.Header>
          <Card.Title>Reservas del día</Card.Title>
        </Card.Header>
        <Card.Content className="px-1 sm:px-2">
          {activeBookings.length === 0 ? (
            <EmptyState icon={CalendarX2} title="Sin reservas para este día" className="mx-4 my-2 border-0" />
          ) : (
            <BookingsTable bookings={activeBookings} onCancel={setCancelling} />
          )}
        </Card.Content>
      </Card>

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancelar reserva"
        description={`Se cancelará la reserva de ${cancelling?.playerName} (${cancelling?.startTime} – ${cancelling?.endTime}) y el horario volverá a quedar libre.`}
        confirmLabel="Cancelar reserva"
        loading={cancel.isPending}
        error={cancel.error}
        onConfirm={handleCancel}
        onClose={() => {
          setCancelling(null);
          cancel.reset();
        }}
      />
    </>
  );
}

function CourtRow({ court, bookings }) {
  const unavailable = court.status !== "ACTIVE";

  return (
    <>
      <div role="rowheader" className="flex items-center pr-3 text-sm font-medium text-white">
        <span className="truncate">{court.name}</span>
      </div>
      {HOURS.map((hour) => {
        const booking = bookings.find((b) => overlapsHour(b, hour));
        const startsHere = booking && Math.floor(minutesOf(booking.startTime) / 60) === hour;

        return (
          <div
            key={hour}
            role="cell"
            title={booking ? `${booking.playerName} · ${booking.startTime}–${booking.endTime}` : undefined}
            className={cn(
              "flex h-11 items-center justify-center rounded-lg text-xs font-semibold",
              unavailable && "bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(51_65_85/0.45)_6px_8px)] bg-slate-900/40",
              !unavailable && !booking && "bg-slate-800/40 ring-1 ring-slate-800",
              booking?.status === "CONFIRMED" && "bg-brand-500/25 text-brand-200 ring-1 ring-brand-500/40",
              booking?.status === "PENDING" && "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40",
            )}
          >
            {startsHere ? initials(booking.playerName) : null}
          </div>
        );
      })}
    </>
  );
}

function Legend() {
  const items = [
    { label: "Libre", className: "bg-slate-800/40 ring-1 ring-slate-800" },
    { label: "Confirmada", className: "bg-brand-500/25 ring-1 ring-brand-500/40" },
    { label: "Pendiente", className: "bg-amber-500/20 ring-1 ring-amber-500/40" },
    { label: "No disponible", className: "bg-slate-900/40 ring-1 ring-slate-700" },
  ];
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className={cn("size-3.5 rounded", item.className)} /> {item.label}
        </li>
      ))}
    </ul>
  );
}
