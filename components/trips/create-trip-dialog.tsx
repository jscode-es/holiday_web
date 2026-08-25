"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createTrip } from "@/lib/actions/trips";

export function CreateTripDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await createTrip({ name: trimmed, emoji: emoji.trim() || null });
    setSaving(false);
    setName("");
    setEmoji("");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo viaje</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trip-name">Nombre</Label>
            <Input
              id="trip-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="p. ej. Italia 2027"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trip-emoji">Emoji (opcional)</Label>
            <Input
              id="trip-emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🇮🇹"
              maxLength={4}
            />
          </div>
          <Button type="submit" disabled={saving || !name.trim()} className="rounded-full">
            {saving ? "Creando…" : "Crear viaje"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
