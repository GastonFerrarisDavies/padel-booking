"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { dashboardNav } from "@/config/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/format";
import { Logo } from "./Logo";

/**
 * Layout del panel: sidebar (fijo en desktop, drawer en móvil) + área principal.
 * Debe renderizarse dentro de <AuthGuard> (asume `user` definido).
 */
export function DashboardShell({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = dashboardNav.filter((item) => item.roles.includes(user.role));
  const isActive = (href) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:bg-slate-950/40",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <Logo href="/dashboard" />
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Panel" className="flex-1 space-y-1 p-3">
          {items.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                isActive(href)
                  ? "bg-brand-500/15 text-white ring-1 ring-brand-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
              )}
            >
              <Icon className={cn("size-[18px]", isActive(href) && "text-brand-400")} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-300">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <Badge tone="brand" className="mt-0.5">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" leadingIcon={<LogOut className="size-4" />} onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 backdrop-blur-xl sm:px-8">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <span className="max-lg:hidden" />
          <Button href="/" variant="secondary" size="sm" trailingIcon={<ExternalLink className="size-4" />}>
            Ver sitio
          </Button>
        </header>
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
