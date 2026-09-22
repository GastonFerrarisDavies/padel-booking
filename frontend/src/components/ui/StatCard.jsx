import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

/** KPI. `delta` en % (positivo/negativo) respecto al período anterior. `icon` es un componente lucide. */
export function StatCard({ label, value, delta, icon: Icon, className }) {
  const positive = delta >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        {Icon && (
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-white">{value}</p>
      {delta != null && (
        <p className={cn("mt-2 flex items-center gap-1.5 text-xs font-medium", positive ? "text-emerald-400" : "text-rose-400")}>
          <TrendIcon className="size-3.5" />
          {positive ? "+" : ""}
          {delta.toLocaleString("es-AR")}%
          <span className="font-normal text-slate-500">vs. semana anterior</span>
        </p>
      )}
    </Card>
  );
}
