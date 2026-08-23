import { DayCell } from "./day-cell";
import type { DayWithActivities } from "@/lib/queries/days";

const monthLabel: Record<string, string> = {
  "2026-09": "Septiembre 2026",
  "2026-10": "Octubre 2026",
};

export function MonthGrid({ days }: { days: DayWithActivities[] }) {
  const byMonth = new Map<string, DayWithActivities[]>();
  for (const day of days) {
    const month = day.date.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), day]);
  }

  return (
    <div className="space-y-10">
      {[...byMonth.entries()].map(([month, monthDays]) => (
        <div key={month} className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">
            {monthLabel[month] ?? month}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {monthDays.map((day) => (
              <DayCell key={day.id} day={day} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
