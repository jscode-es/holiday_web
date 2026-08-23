"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateDay } from "@/lib/actions/days";
import type { Day } from "@/lib/queries/days";

export function DayForm({ day, onDone }: { day: Day; onDone: () => void }) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    await updateDay(day.id, {
      date: formData.get("date") as string,
      title: formData.get("title") as string,
      summary: (formData.get("summary") as string) || null,
    });

    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={day.date} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Tema del día</Label>
          <Input id="title" name="title" defaultValue={day.title} required placeholder="p. ej. Osaka" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Resumen</Label>
        <Textarea id="summary" name="summary" defaultValue={day.summary ?? ""} />
      </div>

      <Button type="submit" disabled={saving} className="rounded-full">
        {saving ? "Guardando…" : "Guardar cambios del día"}
      </Button>
    </form>
  );
}
