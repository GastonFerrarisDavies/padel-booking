import { cn } from "@/lib/cn";

/** Estado vacío. `icon` es un componente de lucide (ej. `Search`), `action` cualquier nodo. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400">
          <Icon className="size-6" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
      {action}
    </div>
  );
}
