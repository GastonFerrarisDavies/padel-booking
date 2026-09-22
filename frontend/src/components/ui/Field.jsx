import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const control =
  "h-11 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 text-sm text-white " +
  "placeholder:text-slate-500 transition focus:border-brand-500 focus:outline-none focus:ring-2 " +
  "focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Envuelve un control con etiqueta, ayuda y error. El `<label>` contiene al control,
 * por lo que la asociación es implícita (sin ids).
 * <Field label="Fecha"><Input type="date" /></Field>
 */
export function Field({ label, hint, error, className, children }) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-xs text-rose-400">
          {error}
        </span>
      ) : (
        hint && <span className="text-xs text-slate-500">{hint}</span>
      )}
    </label>
  );
}

export function Input({ leadingIcon, className, ...props }) {
  if (!leadingIcon) return <input className={cn(control, className)} {...props} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500 [&>svg]:size-4">
        {leadingIcon}
      </span>
      <input className={cn(control, "pl-10", className)} {...props} />
    </div>
  );
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 text-sm text-slate-300", className)}>
      <input type="checkbox" className="size-4 rounded border-slate-600 bg-slate-900 accent-brand-500" {...props} />
      {label}
    </label>
  );
}

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select className={cn(control, "appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
