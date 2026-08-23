import { getAllDaysWithActivities } from "@/lib/queries/days";
import { MonthGrid } from "@/components/calendar/month-grid";
import { DaySheet } from "@/components/calendar/day-sheet";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const days = await getAllDaysWithActivities();
  const { day } = await searchParams;
  const selectedDay = day ? days.find((d) => d.id === Number(day)) : undefined;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Calendario</h1>
        <p className="text-sm text-neutral-400">{days.length} días · haz clic en un día para ver el itinerario</p>
      </div>
      <MonthGrid days={days} />
      <DaySheet day={selectedDay} />
    </div>
  );
}
