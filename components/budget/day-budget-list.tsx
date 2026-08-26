import { formatCurrency, type Currency } from "@/lib/currency";
import type { DayBudget } from "@/lib/queries/budget";

export function DayBudgetList({ days, displayCurrency }: { days: DayBudget[]; displayCurrency: Currency | null }) {
  return (
    <div className="space-y-2">
      {days.map((day) => (
        <details key={day.dayId} className="group rounded-xl border border-neutral-100 open:pb-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5">
            <span className="min-w-0 truncate text-sm font-medium text-neutral-700">
              Día {day.dayNumber} · {day.title}
            </span>
            <span className="shrink-0 text-sm font-semibold text-neutral-900">
              {displayCurrency && day.total != null ? formatCurrency(day.total, displayCurrency) : "—"}
            </span>
          </summary>
          <ul className="space-y-1 px-3">
            {day.activities.length === 0 ? (
              <li className="py-2 text-xs text-neutral-400">Sin gastos registrados este día.</li>
            ) : (
              day.activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between gap-3 py-1 text-sm">
                  <span className="min-w-0 truncate text-neutral-600">
                    {activity.time && <span className="text-neutral-400">{activity.time} · </span>}
                    {activity.title}
                  </span>
                  <span className="shrink-0 font-medium text-neutral-700">
                    {formatCurrency(activity.cost, activity.currency)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </details>
      ))}
    </div>
  );
}
