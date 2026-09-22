import { ArrowRight, CircleCheck, Play, Zap } from "lucide-react";
import { CourtArt } from "@/components/court/CourtArt";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Highlight } from "@/components/ui/Highlight";
import { StarRating } from "@/components/ui/StarRating";

const AVATARS = ["MA", "SB", "CR", "NV"];

/** Server Component (HTML estático). El buscador vive en <BookingExplorer />. */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-16 pb-28 sm:pt-24 lg:pb-32">
      <div aria-hidden className="bg-court-grid absolute inset-0 -z-10" />

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <div className="animate-fade-up">
            <Badge tone="brand" icon={<Zap className="size-3.5" />} className="px-3.5 py-1.5 text-sm">
              Reservas en tiempo real
            </Badge>
          </div>

          <h1
            className="animate-fade-up mt-6 font-display text-5xl leading-[1.05] font-bold tracking-tight text-white text-glow sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Reservá tu <Highlight>cancha de pádel</Highlight> en <Highlight>segundos</Highlight>
          </h1>

          <p className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-slate-400" style={{ animationDelay: "160ms" }}>
            Elegí día, horario y superficie. Ves la disponibilidad al instante, sin llamadas ni mensajes de vuelta.
          </p>

          <div className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
            <Button href="#canchas" size="lg" trailingIcon={<ArrowRight className="size-5" />}>
              Reservar ahora
            </Button>
            <Button href="#como-funciona" variant="secondary" size="lg" leadingIcon={<Play className="size-4 fill-current" />}>
              Ver cómo funciona
            </Button>
          </div>

          <TrustIndicators />
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function TrustIndicators() {
  return (
    <div className="animate-fade-up mt-10 flex flex-col gap-5 sm:flex-row sm:items-center" style={{ animationDelay: "320ms" }}>
      <div className="flex -space-x-2.5" aria-hidden>
        {AVATARS.map((initials) => (
          <span
            key={initials}
            className="flex size-10 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-xs font-semibold text-brand-300"
          >
            {initials}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <StarRating value={4.9} count={2300} />
        <p className="text-sm text-slate-400">
          <strong className="font-semibold text-white">Más de 100 clubes</strong> ya lo utilizan
        </p>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-md lg:h-[520px]" aria-hidden>
      <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-3xl" />
      {/* El transform 3D va en el wrapper; `animate-float` (también transform) en el hijo. */}
      <div
        className="absolute top-1/2 left-1/2 h-[460px] w-[230px] max-lg:scale-75"
        style={{ transform: "translate(-50%, -50%) perspective(1100px) rotateX(58deg) rotateZ(-28deg)" }}
      >
        <div className="animate-float h-full w-full">
          <CourtArt surface="CRISTAL" />
        </div>
      </div>

      <div className="animate-float absolute top-8 right-0 flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 shadow-2xl backdrop-blur-xl" style={{ animationDelay: "-2s" }}>
        <span className="animate-pulse-ring size-2.5 rounded-full bg-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-white">Cancha 3 · 19:30</p>
          <p className="text-xs text-slate-400">Libre ahora</p>
        </div>
      </div>

      <div className="animate-float absolute bottom-10 left-0 flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 shadow-2xl backdrop-blur-xl" style={{ animationDelay: "-4s" }}>
        <CircleCheck className="size-6 text-brand-400" />
        <div>
          <p className="text-sm font-semibold text-white">Reserva confirmada</p>
          <p className="text-xs text-slate-400">Sábado · 18:00 · Cancha 1</p>
        </div>
      </div>
    </div>
  );
}
