import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DayWithActivities } from "@/lib/queries/days";

export function DayCell({ day }: { day: DayWithActivities }) {
  const pendingCount = day.activities.filter((a) => a.status === "pendiente").length;

  return (
    <Link
      href={`/calendario?day=${day.id}`}
      className={cn(
        "flex flex-col gap-1 rounded-md border p-2 text-left hover:bg-accent",
        "min-h-[92px]"
      )}
    >
      <span className="text-xs text-muted-foreground">Día {day.dayNumber}</span>
      <span className="text-sm font-medium leading-tight">{day.title}</span>
      <div className="mt-auto flex items-center gap-2">
        <Badge variant="secondary">{day.activities.length} act.</Badge>
        {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pend.</Badge>}
      </div>
    </Link>
  );
}
