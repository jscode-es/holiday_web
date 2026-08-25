"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/shared/image-uploader";
import { createDay, updateDay } from "@/lib/actions/days";
import type { Day } from "@/lib/queries/days";

export function DayForm({
  tripId,
  day,
  nextDayNumber,
  onDone,
}: {
  tripId: number;
  day?: Day;
  nextDayNumber?: number;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState(day?.imageUrl ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    const fields = {
      date: formData.get("date") as string,
      title: formData.get("title") as string,
      summary: (formData.get("summary") as string) || null,
      imageUrl: imageUrl.trim() || null,
    };

    if (day) {
      await updateDay(day.id, fields);
    } else {
      await createDay({ tripId, dayNumber: nextDayNumber ?? 1, ...fields });
    }

    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={day?.date} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Tema del día</Label>
          <Input id="title" name="title" defaultValue={day?.title} required placeholder="p. ej. Osaka" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Resumen</Label>
        <Textarea id="summary" name="summary" defaultValue={day?.summary ?? ""} />
      </div>

      <div className="space-y-2">
        <Label>Imagen de cabecera</Label>
        <ImageUploader value={imageUrl} onChange={setImageUrl} />
      </div>

      <Button type="submit" disabled={saving} className="rounded-full">
        {saving ? "Guardando…" : day ? "Guardar cambios del día" : "Crear día"}
      </Button>
    </form>
  );
}
