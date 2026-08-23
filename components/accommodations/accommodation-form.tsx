"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Accommodation } from "@/lib/queries/accommodations";
import {
  createAccommodation,
  updateAccommodation,
  type AccommodationInput,
} from "@/lib/actions/accommodations";

const STATUSES: AccommodationInput["status"][] = ["programado", "confirmado", "pendiente"];

export function AccommodationForm({
  accommodation,
  onDone,
}: {
  accommodation?: Accommodation;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<AccommodationInput["status"]>(accommodation?.status ?? "pendiente");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    const input: AccommodationInput = {
      name: formData.get("name") as string,
      checkIn: formData.get("checkIn") as string,
      checkOut: formData.get("checkOut") as string,
      nights: formData.get("nights") ? Number(formData.get("nights")) : null,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      currency: (formData.get("currency") as AccommodationInput["currency"]) || null,
      status,
      address: (formData.get("address") as string) || null,
      lat: null,
      lng: null,
      notes: (formData.get("notes") as string) || null,
    };

    if (accommodation) {
      await updateAccommodation(accommodation.id, input);
    } else {
      await createAccommodation(input);
    }
    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={accommodation?.name ?? ""} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkIn">Check-in</Label>
          <Input id="checkIn" name="checkIn" type="date" defaultValue={accommodation?.checkIn ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkOut">Check-out</Label>
          <Input id="checkOut" name="checkOut" type="date" defaultValue={accommodation?.checkOut ?? ""} required />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nights">Noches</Label>
          <Input id="nights" name="nights" type="number" defaultValue={accommodation?.nights ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost">Coste</Label>
          <Input id="cost" name="cost" type="number" step="0.01" defaultValue={accommodation?.cost ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" name="currency" placeholder="EUR / JPY" defaultValue={accommodation?.currency ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as AccommodationInput["status"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={accommodation?.address ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" defaultValue={accommodation?.notes ?? ""} />
      </div>

      <Button type="submit" disabled={saving} className="rounded-full">
        {saving ? "Guardando…" : accommodation ? "Guardar cambios" : "Añadir alojamiento"}
      </Button>
    </form>
  );
}
