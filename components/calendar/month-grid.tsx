import Link from "next/link";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  format,
  parse,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DayWithActivities } from "@/lib/queries/days";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toDate(iso: string) {
  return parse(iso, "yyyy-MM-dd", new Date());
}

export function MonthGrid({ days }: { days: DayWithActivities[] }) {
  if (days.length === 0) return null;

  const byDate = new Map(days.map((d) => [d.date, d]));
  const tripStart = toDate(days[0].date);
  const tripEnd = toDate(days[days.length - 1].date);
  const months = eachMonthOfInterval({ start: tripStart, end: tripEnd });

  return (
    <div className="space-y-10">
      {months.map((month) => {
        const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
        const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
        const cells = eachDayOfInterval({ start: gridStart, end: gridEnd });
        const monthLabel = format(month, "MMMM yyyy", { locale: es });

        return (
          <div key={month.toISOString()} className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 capitalize">{monthLabel}</h2>

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-100">
              {WEEKDAYS.map((w) => (
                <div key={w} className="bg-neutral-50 py-2 text-center text-xs font-semibold text-neutral-400">
                  {w}
                </div>
              ))}

              {cells.map((date) => {
                const iso = format(date, "yyyy-MM-dd");
                const inMonth = isSameMonth(date, month);
                const tripDay = byDate.get(iso);
                const isTripStart = iso === days[0].date;
                const isTripEnd = iso === days[days.length - 1].date;
                const weekday = getDay(date); // 0=Sun..6=Sat
                const isWeekStart = weekday === 1;
                const isWeekEnd = weekday === 0;
                const capLeft = isTripStart || isWeekStart;
                const capRight = isTripEnd || isWeekEnd;
                const pendingCount = tripDay?.activities.filter((a) => a.status === "pendiente").length ?? 0;

                const cellBody = (
                  <div
                    className={cn(
                      "flex min-h-24 flex-col gap-1 bg-white p-2",
                      tripDay && "bg-amber-50",
                      tripDay && capLeft && "rounded-l-xl",
                      tripDay && capRight && "rounded-r-xl",
                      !inMonth && "bg-neutral-50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        !inMonth ? "text-neutral-300" : tripDay ? "text-neutral-900" : "text-neutral-400"
                      )}
                    >
                      {format(date, "d")}
                    </span>
                    {tripDay && (
                      <>
                        <span className="line-clamp-2 text-xs font-medium text-neutral-700">{tripDay.title}</span>
                        <div className="mt-auto flex flex-wrap items-center gap-1">
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            {tripDay.activities.length}
                          </Badge>
                          {pendingCount > 0 && (
                            <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                              {pendingCount}
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );

                return tripDay ? (
                  <Link
                    key={iso}
                    href={`/calendario?day=${tripDay.id}`}
                    className="transition-colors hover:brightness-95"
                  >
                    {cellBody}
                  </Link>
                ) : (
                  <div key={iso}>{cellBody}</div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
