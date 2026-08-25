"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { isReadOnly } from "@/lib/env";
import { setActiveTrip } from "@/lib/actions/trips";
import { CreateTripDialog } from "@/components/trips/create-trip-dialog";
import type { Trip } from "@/lib/queries/trips";

export function TripSwitcher({ activeTrip, trips }: { activeTrip: Trip; trips: Trip[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleSelect(tripId: number) {
    setOpen(false);
    if (tripId === activeTrip.id) return;
    await setActiveTrip(tripId);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left hover:bg-neutral-50"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
          {activeTrip.emoji || "🧳"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-neutral-900">{activeTrip.name}</p>
          {(activeTrip.startDate || activeTrip.endDate) && (
            <p className="truncate text-xs text-neutral-400">
              {activeTrip.startDate ?? "?"} — {activeTrip.endDate ?? "?"}
            </p>
          )}
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-56 rounded-xl border border-neutral-100 bg-white p-1 shadow-lg">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => handleSelect(trip.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
                  trip.id === activeTrip.id
                    ? "bg-neutral-100 font-semibold text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50"
                )}
              >
                <span>{trip.emoji || "🧳"}</span>
                <span className="truncate">{trip.name}</span>
              </button>
            ))}
            {!isReadOnly && (
              <button
                onClick={() => {
                  setOpen(false);
                  setCreating(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                <Plus className="size-4" />
                Crear viaje
              </button>
            )}
          </div>
        </>
      )}

      <CreateTripDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
