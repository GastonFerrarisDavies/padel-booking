import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Server Component. CTA para dueños de clubes → acceso al dashboard. */
export function ClubsCta() {
  return (
    <section id="clubes" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-28 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-linear-to-br from-brand-700/40 via-slate-900 to-slate-950 p-8 sm:p-14">
        <div aria-hidden className="absolute -top-24 -right-24 size-80 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <ChartNoAxesCombined className="size-10 text-brand-400" />
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              ¿Tenés un club? Llená tus canchas y <span className="text-brand-500">olvidate del papel</span>
            </h2>
            <p className="mt-4 text-slate-400">
              Panel para gestionar canchas, horarios, reservas y usuarios, con estadísticas de ocupación e ingresos.
            </p>
          </div>
          <Button href="/login" size="lg" trailingIcon={<ArrowRight className="size-5" />}>
            Acceder al panel
          </Button>
        </div>
      </div>
    </section>
  );
}
