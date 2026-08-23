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
import type { DayWithActivities, Activity } from "@/lib/queries/days";

export function DaySheet({ day }: { day: DayWithActivities | undefined }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Activity | "new" | null>(null);

  function close() {
    setEditing(null);
    router.push("/calendario");
  }

  return (
    <Sheet open={!!day} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {day && (
          <>
            <SheetHeader>
              <SheetTitle>
                Día {day.dayNumber} · {day.title}
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
                  <Button size="sm" className="mb-4" onClick={() => setEditing("new")}>
                    Añadir actividad
                  </Button>
                  <ScrollArea className="h-[60vh]">
                    {day.activities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} onEdit={setEditing} />
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
