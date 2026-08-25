"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createBag } from "@/lib/actions/bags";
import { isReadOnly } from "@/lib/env";

export function AddBagButton({ tripId }: { tripId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await createBag(tripId, trimmed);
    setSaving(false);
    setName("");
    setOpen(false);
    router.refresh();
  }

  if (isReadOnly) return null;

  return (
    <>
      <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nueva maleta
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva maleta o mochila</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="p. ej. Maleta grande, Mochila cabina…"
            />
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? "Creando…" : "Crear"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
