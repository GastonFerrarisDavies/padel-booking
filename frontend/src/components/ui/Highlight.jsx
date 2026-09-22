import { cn } from "@/lib/cn";

/** Palabra clave de un título: azul vibrante (#4F86F7). */
export function Highlight({ className, ...props }) {
  return <span className={cn("text-brand-500", className)} {...props} />;
}
