import { CalendarCheck, Search, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";

const STEPS = [
  { icon: Search, title: "Buscá", text: "Elegí fecha, hora y duración. Te mostramos solo lo que está libre." },
  { icon: CalendarCheck, title: "Reservá", text: "Confirmá en dos pasos. Sin llamadas, sin mensajes de ida y vuelta." },
  { icon: Trophy, title: "Jugá", text: "Llegá a la cancha con tu reserva confirmada y a disfrutar del partido." },
];

/** Server Component. */
export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-28 sm:px-6 lg:px-8">
      <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Del celular a la cancha en <span className="text-brand-500">tres pasos</span>
      </h2>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, index) => (
          <li key={title}>
            <Card className="h-full p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400">
                  <Icon className="size-6" />
                </span>
                <span className="font-display text-5xl font-bold text-slate-800">0{index + 1}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-white">{title}</h3>
              <p className="mt-2 text-slate-400">{text}</p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
