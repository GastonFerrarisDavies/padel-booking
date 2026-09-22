import { cn } from "@/lib/cn";

const variants = {
  glass: "border border-slate-800 bg-slate-900/60 backdrop-blur-xl",
  solid: "border border-slate-800 bg-slate-900",
  interactive:
    "border border-slate-800 bg-slate-900/60 backdrop-blur-xl transition duration-300 " +
    "hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10",
};

/**
 * Tarjeta compuesta:
 * <Card><Card.Header><Card.Title/><Card.Description/></Card.Header><Card.Content/><Card.Footer/></Card>
 * `variant`: glass | solid | interactive
 */
export function Card({ variant = "glass", className, ...props }) {
  return <div className={cn("overflow-hidden rounded-2xl", variants[variant], className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-0", className)} {...props} />;
}

export function CardTitle({ as: Tag = "h3", className, ...props }) {
  return <Tag className={cn("font-display text-lg font-semibold text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center gap-3 border-t border-slate-800 p-4", className)} {...props} />;
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;
