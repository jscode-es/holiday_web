"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTripDialog } from "@/components/trips/create-trip-dialog";
import { isReadOnly } from "@/lib/env";

export function EmptyTripsState() {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-white px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <Plane className="size-6" />
      </span>
      <div>
        <p className="text-lg font-bold text-neutral-900">Aún no tienes ningún viaje</p>
        <p className="text-sm text-neutral-400">Crea tu primer viaje para empezar a planificarlo.</p>
      </div>
      {!isReadOnly && (
        <Button className="rounded-full" onClick={() => setCreating(true)}>
          Crear mi primer viaje
        </Button>
      )}
      <CreateTripDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
