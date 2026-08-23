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
import type { Activity } from "@/lib/queries/days";
import { createActivity, updateActivity, type ActivityInput } from "@/lib/actions/activities";

const TYPES: ActivityInput["type"][] = ["transport", "place", "event", "comida", "nota", "aviso", "hotel"];
const STATUSES: NonNullable<ActivityInput["status"]>[] = ["programado", "confirmado", "pendiente"];

export function ActivityForm({
  dayId,
  activity,
  onDone,
}: {
  dayId: number;
  activity?: Activity;
  onDone: () => void;
}) {
  const [type, setType] = useState<ActivityInput["type"]>(activity?.type ?? "place");
  const [status, setStatus] = useState<ActivityInput["status"]>(activity?.status ?? null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    const input: ActivityInput = {
      dayId,
      time: (formData.get("time") as string) || null,
      type,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      status,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      currency: (formData.get("currency") as ActivityInput["currency"]) || null,
      durationMin: formData.get("durationMin") ? Number(formData.get("durationMin")) : null,
      origin: (formData.get("origin") as string) || null,
      destination: (formData.get("destination") as string) || null,
      originLat: null,
      originLng: null,
      destLat: null,
      destLng: null,
    };

    if (activity) {
      await updateActivity(activity.id, input);
    } else {
      await createActivity(input);
    }
    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="time">Hora</Label>
          <Input id="time" name="time" type="time" defaultValue={activity?.time ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as ActivityInput["type"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={activity?.title ?? ""} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" defaultValue={activity?.description ?? ""} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={status ?? undefined} onValueChange={(v) => setStatus(v as ActivityInput["status"])}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
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
          <Label htmlFor="cost">Coste</Label>
          <Input id="cost" name="cost" type="number" step="0.01" defaultValue={activity?.cost ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" name="currency" placeholder="EUR / JPY" defaultValue={activity?.currency ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="durationMin">Duración (min)</Label>
          <Input id="durationMin" name="durationMin" type="number" defaultValue={activity?.durationMin ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="origin">Origen</Label>
          <Input id="origin" name="origin" defaultValue={activity?.origin ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="destination">Destino</Label>
          <Input id="destination" name="destination" defaultValue={activity?.destination ?? ""} />
        </div>
      </div>

      <Button type="submit" disabled={saving} className="rounded-full">
        {saving ? "Guardando…" : activity ? "Guardar cambios" : "Añadir actividad"}
      </Button>
    </form>
  );
}
