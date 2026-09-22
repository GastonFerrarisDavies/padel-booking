import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Chips con los próximos horarios libres. `onSelect(slot)` recibe el slot elegido.
 * (Es un componente de presentación: se usa desde Client Components que pasan el callback.)
 */
export function SlotList({ slots, onSelect, max = 4, className }) {
  const visible = slots.slice(0, max);
  const hidden = slots.length - visible.length;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-slate-500 uppercase">
        <Clock className="size-3.5" /> Horarios libres
      </p>
      <div className="flex flex-wrap gap-2">
        {visible.map((slot) => (
          <button
            key={slot.start}
            type="button"
            onClick={() => onSelect(slot)}
            className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-sm font-semibold text-brand-300 transition hover:border-brand-500 hover:bg-brand-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            {slot.start}
          </button>
        ))}
        {hidden > 0 && <span className="self-center text-xs text-slate-500">+{hidden} más</span>}
      </div>
    </div>
  );
}
