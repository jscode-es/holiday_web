"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ActivityCard } from "./activity-card";
import type { DayWithActivities } from "@/lib/queries/days";

export function DayTabs({ days }: { days: DayWithActivities[] }) {
  const [index, setIndex] = useState(0);
  const day = days[index];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {days.map((d, i) => {
          const pendingCount = d.activities.filter((a) => a.status === "pendiente").length;
          const active = i === index;
          return (
            <button
              key={d.id}
              onClick={() => setIndex(i)}
              className={cn(
                "flex min-w-23 flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors",
                active
                  ? "border-black bg-black text-white"
                  : "border-neutral-100 bg-white text-neutral-500 hover:border-neutral-200 hover:text-neutral-900"
              )}
            >
              <span className="flex w-full items-center justify-between gap-2 text-xs font-semibold">
                Día {d.dayNumber}
                {pendingCount > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {pendingCount}
                  </span>
                )}
              </span>
              <span className={cn("text-[11px]", active ? "text-white/70" : "text-neutral-400")}>{d.date.slice(5)}</span>
            </button>
          );
        })}
      </div>

      {day && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{day.title}</h2>
            <p className="text-sm text-neutral-400">
              {day.date} · {day.activities.length} {day.activities.length === 1 ? "actividad" : "actividades"}
            </p>
            {day.summary && <p className="mt-2 max-w-3xl text-sm text-neutral-500">{day.summary}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {day.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
