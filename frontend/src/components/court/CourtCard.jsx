import { Sun, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";
import { COURT_STATUS, COURT_STATUS_TONE, SURFACES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { CourtArt } from "./CourtArt";

/**
 * Tarjeta de cancha, reutilizada en la home (con horarios) y en el dashboard (con acciones).
 * Composición: el contenido específico de cada vista entra por `children` (cuerpo) y `footer`.
 *
 * <CourtCard court={court} footer={<Button>Reservar</Button>}>
 *   <SlotList ... />
 * </CourtCard>
 */
export function CourtCard({ court, showStatus = false, footer, children }) {
  const IndoorIcon = court.indoor ? Warehouse : Sun;

  return (
    <Card variant="interactive" className="flex h-full flex-col">
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-linear-to-b from-slate-900 to-blue-950/60">
        <div className="absolute inset-0 bg-court-grid opacity-60" />
        <div className="relative h-[190px] w-[95px] -rotate-90 scale-[0.85]">
          <CourtArt surface={court.surface} />
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge tone="brand" icon={<IndoorIcon className="size-3" />}>
            {court.indoor ? "Techada" : "Aire libre"}
          </Badge>
          {showStatus && <Badge tone={COURT_STATUS_TONE[court.status]}>{COURT_STATUS[court.status]}</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold text-white">{court.name}</h3>
            <p className="text-sm text-slate-400">Superficie {SURFACES[court.surface]?.toLowerCase()}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-white">{formatCurrency(court.pricePerHour)}</p>
            <p className="text-xs text-slate-500">por hora</p>
          </div>
        </div>

        {court.reviewsCount > 0 && <StarRating value={court.rating} count={court.reviewsCount} size="sm" />}

        {children}
      </div>

      {footer && <Card.Footer>{footer}</Card.Footer>}
    </Card>
  );
}
