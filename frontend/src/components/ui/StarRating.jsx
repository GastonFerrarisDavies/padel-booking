import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

const STARS = [0, 1, 2, 3, 4];
const sizes = { sm: "size-3.5", md: "size-4", lg: "size-5" };

/**
 * Estrellas amarillas con relleno parcial (ej. 4.6 → 92 %).
 * Trust indicator: `<StarRating value={4.9} count={2300} />`.
 */
export function StarRating({ value = 0, count, size = "md", className }) {
  const pct = Math.max(0, Math.min(5, value)) * 20;
  const starClass = cn("shrink-0 fill-current", sizes[size]);

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div role="img" aria-label={`${value.toFixed(1)} de 5 estrellas`} className="relative inline-flex">
        <div className="flex text-slate-700">
          {STARS.map((i) => (
            <Star key={i} className={starClass} />
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 flex overflow-hidden text-yellow-400" style={{ width: `${pct}%` }}>
          {STARS.map((i) => (
            <Star key={i} className={starClass} />
          ))}
        </div>
      </div>
      <span className="text-sm font-semibold text-white">{value.toFixed(1)}</span>
      {count != null && <span className="text-sm text-slate-400">({count.toLocaleString("es-AR")})</span>}
    </div>
  );
}
