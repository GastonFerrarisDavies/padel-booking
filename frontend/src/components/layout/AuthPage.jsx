import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

/** Server Component. Marco de las pantallas de Clerk (sign-in / sign-up). */
export function AuthPage({ children }) {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div aria-hidden className="bg-court-grid absolute inset-0 -z-10" />
      <Logo />
      {children}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
        <ArrowLeft className="size-4" /> Volver al sitio
      </Link>
    </main>
  );
}
