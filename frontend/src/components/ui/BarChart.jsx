import { cn } from "@/lib/cn";

/**
 * Gráfico de barras de una serie (sin dependencias).
 * data: [{ label, value }] · el último punto se resalta (ej. "hoy").
 * Cada barra expone su valor en hover/foco y en `title` (accesible por teclado con tabIndex).
 */
export function BarChart({ data, formatValue = String, height = 200, ariaLabel, className }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const lastIndex = data.length - 1;

  return (
    <div role="img" aria-label={ariaLabel} className={cn("w-full", className)}>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((point, index) => (
          <div
            key={point.label}
            tabIndex={0}
            title={`${point.label}: ${formatValue(point.value)}`}
            className="group relative flex h-full flex-1 items-end outline-none"
          >
            <div
              className={cn(
                "w-full rounded-t-md transition-all duration-300 group-hover:brightness-125 group-focus-visible:brightness-125",
                index === lastIndex
                  ? "bg-linear-to-t from-brand-600 to-brand-400 shadow-[0_0_24px_rgb(79_134_247/0.45)]"
                  : "bg-linear-to-t from-brand-700/60 to-brand-500/70",
              )}
              style={{ height: `${Math.max((point.value / max) * 100, 3)}%` }}
            />
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {formatValue(point.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((point, index) => (
          <span
            key={point.label}
            className={cn(
              "flex-1 truncate text-center text-[10px] text-slate-500 sm:text-xs",
              index % 2 !== lastIndex % 2 && "max-sm:invisible",
            )}
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
