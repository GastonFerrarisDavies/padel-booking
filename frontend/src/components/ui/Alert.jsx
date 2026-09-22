import { cn } from "@/lib/cn";

const tones = {
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  info: "border-brand-500/30 bg-brand-500/10 text-brand-300",
};

/** Mensaje en línea (errores de formulario, confirmaciones). `tone`: danger | success | info */
export function Alert({ tone = "danger", className, children }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}
