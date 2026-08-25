"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTrip } from "@/lib/actions/trips";
import { isReadOnly } from "@/lib/env";
import type { Trip } from "@/lib/queries/trips";

export function TripSettingsForm({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    const travelersRaw = formData.get("travelers") as string;

    await updateTrip(trip.id, {
      name: formData.get("name") as string,
      emoji: (formData.get("emoji") as string).trim() || null,
      startDate: (formData.get("startDate") as string) || null,
      endDate: (formData.get("endDate") as string) || null,
      travelers: travelersRaw ? Number(travelersRaw) : null,
    });

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
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
  );
}
