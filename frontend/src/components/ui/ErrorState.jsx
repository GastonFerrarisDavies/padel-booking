import { RotateCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/** Error de carga con reintento. `error` es un `ApiError` (o cualquier Error). */
export function ErrorState({ error, onRetry, className }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-12 text-center",
        className,
      )}
    >
      <TriangleAlert className="size-8 text-rose-400" />
      <h3 className="font-display text-lg font-semibold text-white">No pudimos cargar la información</h3>
      <p className="max-w-sm text-sm text-slate-400">{error?.message ?? "Ocurrió un error inesperado."}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" leadingIcon={<RotateCw className="size-4" />} onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
