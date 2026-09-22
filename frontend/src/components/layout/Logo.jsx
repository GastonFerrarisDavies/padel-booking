import Link from "next/link";
import { LandPlot } from "lucide-react";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";

export function Logo({ href = "/", className }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
        <LandPlot className="size-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">{SITE.name}</span>
    </Link>
  );
}
