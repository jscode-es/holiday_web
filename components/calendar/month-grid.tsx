import { DayCell } from "./day-cell";
import type { DayWithActivities } from "@/lib/queries/days";

export function MonthGrid({ days }: { days: DayWithActivities[] }) {
  const byMonth = new Map<string, DayWithActivities[]>();
  for (const day of days) {
    const month = day.date.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), day]);
  }

  return (
    <div className="space-y-8">
      {[...byMonth.entries()].map(([month, monthDays]) => (
        <div key={month} className="space-y-3">
          <h2 className="text-lg font-semibold">{month}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {monthDays.map((day) => (
              <DayCell key={day.id} day={day} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
