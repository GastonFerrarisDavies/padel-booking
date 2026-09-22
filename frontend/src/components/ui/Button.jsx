import Link from "next/link";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 " +
  "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

const variants = {
  primary: "bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-400 hover:shadow-brand-500/40",
  secondary: "border border-slate-700 bg-slate-900/40 text-white hover:border-slate-500 hover:bg-slate-800/60",
  ghost: "text-slate-300 hover:bg-slate-800/60 hover:text-white",
  danger: "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
};

const sizes = {
  sm: "h-9 rounded-lg px-3.5 text-sm",
  md: "h-11 rounded-xl px-5 text-sm",
  lg: "h-14 rounded-2xl px-7 text-base",
  icon: "size-9 rounded-lg",
};

/**
 * Botón del sistema de diseño. Funciona en Server y Client Components.
 * - `variant`: primary | secondary | ghost | danger
 * - `size`: sm | md | lg | icon (icon exige `aria-label`)
 * - `leadingIcon` / `trailingIcon`: elementos (ej. `<ArrowRight className="size-4" />`)
 * - `href`: renderiza un `Link` de Next en lugar de `<button>`.
 */
export function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  loading = false,
  href,
  className,
  children,
  ...props
}) {
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {loading ? <Spinner className="size-4" /> : leadingIcon}
      {children}
      {trailingIcon}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" {...props} className={classes} disabled={loading || props.disabled}>
      {content}
    </button>
  );
}
