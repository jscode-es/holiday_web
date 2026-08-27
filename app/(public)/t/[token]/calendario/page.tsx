import { notFound } from "next/navigation";
import { getTripByShareToken } from "@/lib/queries/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { MonthGrid } from "@/components/calendar/month-grid";
import { DaySheet } from "@/components/calendar/day-sheet";

export default async function PublicCalendarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { token } = await params;
  const trip = await getTripByShareToken(token);
  if (!trip) notFound();
  const days = await getAllDaysWithActivities(trip.id);
  const { day } = await searchParams;
  const selectedDay = day ? days.find((d) => d.id === Number(day)) : undefined;
  const currencyDisplay = { displayCurrency: trip.displayCurrency, eurToJpyRate: trip.eurToJpyRate };
  const basePath = `/t/${token}/calendario`;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Calendario</h1>
        <p className="text-sm text-neutral-400">{days.length} días</p>
      </div>
      {days.length === 0 ? (
        <p className="text-sm text-neutral-400">Este viaje todavía no tiene días.</p>
      ) : (
        <MonthGrid days={days} basePath={basePath} />
      )}
      <DaySheet day={selectedDay} currencyDisplay={currencyDisplay} basePath={basePath} readOnly />
    </div>
  );
}
