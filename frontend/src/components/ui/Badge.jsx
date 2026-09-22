import { cn } from "@/lib/cn";

const tones = {
  neutral: "border-slate-700 bg-slate-800/60 text-slate-300",
  brand: "border-brand-500/30 bg-brand-500/10 text-brand-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

/** `tone`: neutral | brand | success | warning | danger */
export function Badge({ tone = "neutral", icon, className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
