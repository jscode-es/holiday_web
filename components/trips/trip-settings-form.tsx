"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updateTrip } from "@/lib/actions/trips";
import { isReadOnly } from "@/lib/env";
import type { Trip } from "@/lib/queries/trips";
import type { Day } from "@/lib/queries/days";

type PendingUpdate = {
  name: string;
  emoji: string | null;
  startDate: string | null;
  endDate: string | null;
  travelers: number | null;
};

export function TripSettingsForm({ trip, days }: { trip: Trip; days: Day[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<PendingUpdate | null>(null);
  const [daysToRemove, setDaysToRemove] = useState<Day[]>([]);

  async function commit(update: PendingUpdate) {
    setSaving(true);
    setSaved(false);
    await updateTrip(trip.id, update);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const travelersRaw = formData.get("travelers") as string;
    const startDate = (formData.get("startDate") as string) || null;
    const endDate = (formData.get("endDate") as string) || null;

    const update: PendingUpdate = {
      name: formData.get("name") as string,
      emoji: (formData.get("emoji") as string).trim() || null,
      startDate,
      endDate,
      travelers: travelersRaw ? Number(travelersRaw) : null,
    };

    if (startDate && endDate) {
      const outside = days.filter((d) => d.date < startDate || d.date > endDate);
      if (outside.length > 0) {
        setPending(update);
        setDaysToRemove(outside);
        return;
      }
    }

    await commit(update);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trip-settings-name">Nombre</Label>
            <Input id="trip-settings-name" name="name" defaultValue={trip.name} required disabled={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trip-settings-emoji">Emoji</Label>
            <Input
              id="trip-settings-emoji"
              name="emoji"
              defaultValue={trip.emoji ?? ""}
              maxLength={4}
              placeholder="🏖️"
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trip-settings-start">Fecha de inicio</Label>
            <Input
              id="trip-settings-start"
              name="startDate"
              type="date"
              defaultValue={trip.startDate ?? ""}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trip-settings-end">Fecha de fin</Label>
            <Input
              id="trip-settings-end"
              name="endDate"
              type="date"
              defaultValue={trip.endDate ?? ""}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trip-settings-travelers">Nº de viajeros</Label>
          <Input
            id="trip-settings-travelers"
            name="travelers"
            type="number"
            min={1}
            defaultValue={trip.travelers ?? ""}
            className="max-w-32"
            disabled={isReadOnly}
          />
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
            {saved && !saving && <span className="text-sm text-emerald-700">Guardado.</span>}
          </div>
        )}
      </form>

      <ConfirmDialog
        open={pending != null}
        onOpenChange={(open) => !open && setPending(null)}
        title={`¿Borrar ${daysToRemove.length} ${daysToRemove.length === 1 ? "día" : "días"} fuera del nuevo rango?`}
        description={`Se borrarán junto con sus actividades: ${daysToRemove
          .map((d) => `${d.date} (${d.title})`)
          .join(", ")}. Esta acción no se puede deshacer.`}
        confirmLabel="Borrar y guardar"
        onConfirm={async () => {
          if (pending) await commit(pending);
          setPending(null);
        }}
      />
    </>
  );
}
