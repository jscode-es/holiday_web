"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DayForm } from "@/components/itinerario/day-form";
import { isReadOnly } from "@/lib/env";

export function AddDayButton({ tripId, nextDayNumber }: { tripId: number; nextDayNumber: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (isReadOnly) return null;

  return (
    <>
      <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Añadir día
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo día</DialogTitle>
          </DialogHeader>
          <DayForm
            tripId={tripId}
            nextDayNumber={nextDayNumber}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
