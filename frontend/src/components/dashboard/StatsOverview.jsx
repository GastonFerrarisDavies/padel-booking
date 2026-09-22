"use client";

import { CalendarCheck, CalendarX2, CircleDollarSign, Gauge, UserPlus } from "lucide-react";
import { getBookings } from "@entity/booking";
import { getDashboardStats } from "@entity/stats";
import { useQuery } from "@/hooks/useQuery";
import { useToday } from "@/hooks/useToday";
import { BarChart } from "@/components/ui/BarChart";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, parseISODate } from "@/lib/format";
import { BookingsTable } from "./BookingsTable";

/** Vista "Resumen" del dashboard (Client Component). */
export function StatsOverview() {
  const today = useToday();
  const stats = useQuery(["stats"], ({ signal }) => getDashboardStats({ signal }));
  const todayBookings = useQuery(["bookings", today], ({ signal }) => getBookings({ date: today }, { signal }), {
    enabled: Boolean(today),
  });

  return (
    <>
      <PageHeader title="Resumen" description="Cómo viene tu club esta semana." />

      <QueryBoundary query={stats} skeleton={<OverviewSkeleton />} isEmpty={() => false}>
        {(data) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Ingresos (7 días)" value={formatCurrency(data.revenue)} delta={data.revenueDelta} icon={CircleDollarSign} />
              <StatCard label="Reservas" value={data.bookings.toLocaleString("es-AR")} delta={data.bookingsDelta} icon={CalendarCheck} />
              <StatCard label="Ocupación hoy" value={`${data.occupancy}%`} delta={data.occupancyDelta} icon={Gauge} />
              <StatCard label="Jugadores" value={data.newUsers.toLocaleString("es-AR")} delta={data.newUsersDelta} icon={UserPlus} />
            </div>

            <Card>
              <Card.Header>
                <Card.Title>Ingresos de los últimos 14 días</Card.Title>
                <Card.Description>Reservas confirmadas y pendientes.</Card.Description>
              </Card.Header>
              <Card.Content>
                <BarChart
                  ariaLabel="Ingresos diarios de los últimos 14 días"
                  data={data.revenueByDay.map(({ date, value }) => ({ label: String(parseISODate(date).getDate()), value }))}
                  formatValue={formatCurrency}
                />
              </Card.Content>
            </Card>
          </div>
        )}
      </QueryBoundary>

      <Card className="mt-6">
        <Card.Header>
          <Card.Title>Reservas de hoy</Card.Title>
        </Card.Header>
        <Card.Content className="px-1 sm:px-2">
          <QueryBoundary
            query={todayBookings}
            skeleton={<Skeleton className="mx-4 h-40" />}
            empty={<EmptyState icon={CalendarX2} title="Sin reservas para hoy" className="mx-4 my-2 border-0" />}
          >
            {(bookings) => <BookingsTable bookings={bookings} />}
          </QueryBoundary>
        </Card.Content>
      </Card>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
