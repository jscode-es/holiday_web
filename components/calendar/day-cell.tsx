import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DayWithActivities } from "@/lib/queries/days";

const dayGradients = [
  "from-rose-200 via-orange-100 to-amber-50",
  "from-sky-200 via-cyan-100 to-blue-50",
  "from-emerald-200 via-teal-100 to-green-50",
  "from-violet-200 via-purple-100 to-fuchsia-50",
];

export function DayCell({ day }: { day: DayWithActivities }) {
  const pendingCount = day.activities.filter((a) => a.status === "pendiente").length;
  const gradient = dayGradients[day.dayNumber % dayGradients.length];

  return (
    <Link
      href={`/calendario?day=${day.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow hover:shadow-md"
    >
      <div className={cn("relative flex h-20 items-start justify-between bg-linear-to-br p-3", gradient)}>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 backdrop-blur">
          Día {day.dayNumber}
        </span>
        {pendingCount > 0 && (
          <span className="rounded-full bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            {pendingCount} pend.
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs text-neutral-400">{day.date}</p>
        <p className="text-sm leading-snug font-semibold text-neutral-900 group-hover:text-black">{day.title}</p>
        <p className="mt-auto pt-2 text-xs font-medium text-neutral-400">
          {day.activities.length} {day.activities.length === 1 ? "actividad" : "actividades"}
        </p>
      </div>
    </Link>
  );
}
