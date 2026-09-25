import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BookingExplorer } from "@/components/court/BookingExplorer";
import { ClubsCta } from "@/components/home/ClubsCta";
import { HealthCheckLogger } from "@/components/home/HealthCheckLogger";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";

/**
 * Homepage — Server Component (se prerenderiza en build).
 * Solo <BookingExplorer /> es Client Component: consulta la disponibilidad vía @entity/court en el navegador.
 */
export default function HomePage() {
  return (
    <>
      <HealthCheckLogger />
      <SiteHeader />
      <main>
        <Hero />
        <div className="-mt-16">
          <BookingExplorer />
        </div>
        <HowItWorks />
        <ClubsCta />
      </main>
      <SiteFooter />
    </>
  );
}
