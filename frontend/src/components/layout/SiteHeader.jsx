import Link from "next/link";
import { CalendarCheck, LogIn } from "lucide-react";
import { publicNav } from "@/config/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";

/** Server Component. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {publicNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-300 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/login" variant="ghost" size="sm" leadingIcon={<LogIn className="size-4" />} className="max-sm:hidden">
            Acceso clubes
          </Button>
          <Button href="/#canchas" size="sm" leadingIcon={<CalendarCheck className="size-4" />}>
            Reservar
          </Button>
        </div>
      </div>
    </header>
  );
}
