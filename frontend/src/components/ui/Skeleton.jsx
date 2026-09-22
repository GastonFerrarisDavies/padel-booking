import { cn } from "@/lib/cn";

export function Skeleton({ className }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-slate-800/60", className)} />;
}
