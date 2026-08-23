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
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Calendario</h1>
      <MonthGrid days={days} />
      <DaySheet day={selectedDay} />
    </div>
  );
}
