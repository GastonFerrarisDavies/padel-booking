import { Ban } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { BOOKING_STATUS, BOOKING_STATUS_TONE } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

/**
 * Tabla de reservas reutilizada en Resumen y Horarios.
 * Con `onCancel` agrega la columna de acciones.
 */
export function BookingsTable({ bookings, onCancel }) {
  const columns = [
    { key: "time", header: "Horario", cell: (b) => <span className="font-medium text-white">{b.startTime} – {b.endTime}</span> },
    { key: "courtName", header: "Cancha" },
    { key: "playerName", header: "Jugador" },
    { key: "price", header: "Importe", cell: (b) => formatCurrency(b.price) },
    { key: "status", header: "Estado", cell: (b) => <Badge tone={BOOKING_STATUS_TONE[b.status]}>{BOOKING_STATUS[b.status]}</Badge> },
  ];

  if (onCancel) {
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      cell: (b) =>
        b.status !== "CANCELLED" && (
          <Button variant="ghost" size="sm" leadingIcon={<Ban className="size-4" />} onClick={() => onCancel(b)}>
            Cancelar
          </Button>
        ),
    });
  }

  const sorted = bookings.toSorted((a, b) => a.startTime.localeCompare(b.startTime));
  return <DataTable columns={columns} rows={sorted} />;
}
