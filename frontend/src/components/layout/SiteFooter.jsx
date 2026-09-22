import Link from "next/link";
import { SITE } from "@/config/site";
import { publicNav } from "@/config/navigation";
import { Logo } from "./Logo";

/** Server Component. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-800/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row lg:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Logo />
          <p className="text-sm text-slate-500">{SITE.tagline}</p>
        </div>
        <nav aria-label="Pie de página" className="flex items-center gap-6 text-sm text-slate-400">
          {publicNav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="transition hover:text-white">
            Ingresar
          </Link>
        </nav>
      </div>
    </footer>
  );
}
