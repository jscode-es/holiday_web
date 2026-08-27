"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityItem } from "./activity-item";
import { ActivityForm } from "./activity-form";
import { isReadOnly } from "@/lib/env";
import type { DayWithActivities, Activity } from "@/lib/queries/days";
import type { CurrencyDisplay } from "@/lib/currency";

export function DaySheet({
  day,
  currencyDisplay,
  basePath = "/calendario",
}: {
  day: DayWithActivities | undefined;
  currencyDisplay?: CurrencyDisplay;
  basePath?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Activity | "new" | null>(null);

  function close() {
    setEditing(null);
    router.push(basePath);
  }

  return (
    <Sheet open={!!day} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {day && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-lg">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                  {day.dayNumber}
                </span>
                {day.title}
              </SheetTitle>
              {day.summary && <p className="text-sm text-muted-foreground">{day.summary}</p>}
            </SheetHeader>

            <div className="px-4 pb-4">
              {editing ? (
                <ActivityForm
                  dayId={day.id}
                  activity={editing === "new" ? undefined : editing}
                  onDone={() => {
                    setEditing(null);
                    router.refresh();
                  }}
                />
              ) : (
                <>
                  {!isReadOnly && (
                    <Button size="sm" className="mb-4 rounded-full" onClick={() => setEditing("new")}>
                      Añadir actividad
                    </Button>
                  )}
                  <ScrollArea className="h-[60vh]">
                    {day.activities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        onEdit={setEditing}
                        currencyDisplay={currencyDisplay}
                      />
                    ))}
                  </ScrollArea>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
