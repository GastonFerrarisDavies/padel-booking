"use client";

import { useState } from "react";
import { CalendarDays, CircleCheck, Clock, MapPin } from "lucide-react";
import { createBooking } from "@api/entity/booking";
import { useMutation } from "@/hooks/useMutation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatLongDate } from "@/lib/format";

/**
 * Diálogo de reserva. `selection` = { court, slot } o null (cerrado).
 * `onBooked` se llama al confirmar (o ante un conflicto) para refrescar la disponibilidad.
 */
export function BookingDialog({ selection, date, onClose, onBooked }) {
  return (
    <Modal
      open={Boolean(selection)}
      onClose={onClose}
      title="Confirmá tu reserva"
      description="Completá tus datos y la cancha queda tuya."
    >
      {selection && <BookingForm court={selection.court} slot={selection.slot} date={date} onClose={onClose} onBooked={onBooked} />}
    </Modal>
  );
}

function BookingForm({ court, slot, date, onClose, onBooked }) {
  const [form, setForm] = useState({ playerName: "", playerContact: "" });
  const [confirmed, setConfirmed] = useState(false);
  const booking = useMutation(createBooking);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await booking.mutate({
        courtId: court.id,
        date,
        startTime: slot.start,
        endTime: slot.end,
        playerName: form.playerName.trim(),
        playerContact: form.playerContact.trim(),
      });
      setConfirmed(true);
      onBooked();
    } catch {
      onBooked(); // p. ej. 409: el horario ya no está libre → refrescar la grilla
    }
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CircleCheck className="size-14 text-emerald-400" />
        <h3 className="font-display text-xl font-semibold text-white">¡Reserva confirmada!</h3>
        <p className="text-sm text-slate-400">
          {court.name} · {formatLongDate(date)} a las {slot.start}. Te esperamos en la cancha.
        </p>
        <Button className="mt-2" onClick={onClose}>
          Listo
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <dl className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm">
        <SummaryRow icon={MapPin} label="Cancha" value={court.name} />
        <SummaryRow icon={CalendarDays} label="Fecha" value={formatLongDate(date)} />
        <SummaryRow icon={Clock} label="Horario" value={`${slot.start} – ${slot.end}`} />
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <dt className="text-slate-400">Total</dt>
          <dd className="font-display text-lg font-bold text-white">{formatCurrency(slot.price)}</dd>
        </div>
      </dl>

      <Field label="Nombre y apellido">
        <Input required autoComplete="name" value={form.playerName} onChange={update("playerName")} placeholder="Ej. Martín Acosta" />
      </Field>
      <Field label="Teléfono o email" hint="Te enviamos la confirmación por acá.">
        <Input required autoComplete="email" value={form.playerContact} onChange={update("playerContact")} placeholder="tu@correo.com" />
      </Field>

      {booking.error && <Alert>{booking.error.message}</Alert>}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={booking.isPending}>
          Confirmar reserva
        </Button>
      </div>
    </form>
  );
}

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-slate-400">
        <Icon className="size-4" /> {label}
      </dt>
      <dd className="text-right font-medium text-white">{value}</dd>
    </div>
  );
}
