import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ className, label = "Cargando" }) {
  return <LoaderCircle role="status" aria-label={label} className={cn("size-5 animate-spin", className)} />;
}
