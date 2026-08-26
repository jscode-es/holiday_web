import { cn } from "@/lib/utils";
import { formatCurrency, type Currency } from "@/lib/currency";
import type { DayBudget } from "@/lib/queries/budget";

export function DayBudgetChart({ days, displayCurrency }: { days: DayBudget[]; displayCurrency: Currency | null }) {
  const totals = days.map((d) => d.total ?? 0);
  const max = Math.max(1, ...totals);

  return (
    <div className="flex items-end gap-2 overflow-x-auto pb-1">
      {days.map((day) => {
        const total = day.total ?? 0;
        const height = Math.round((total / max) * 100);
        return (
          <div key={day.dayId} className="flex w-12 shrink-0 flex-col items-center gap-1.5">
            <span className="text-[11px] font-medium text-neutral-500">
              {displayCurrency && day.total != null ? formatCurrency(total, displayCurrency) : total ? `${total}` : "—"}
            </span>
            <div className="flex h-24 w-full items-end rounded-md bg-neutral-50">
              <div
                className={cn("w-full rounded-md bg-black transition-all", total === 0 && "bg-neutral-200")}
                style={{ height: `${Math.max(height, total > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-neutral-400">D{day.dayNumber}</span>
          </div>
        );
      })}
    </div>
  );
}
