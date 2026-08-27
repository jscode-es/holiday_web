"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateAccommodation } from "@/lib/actions/accommodations";
import type { Accommodation } from "@/lib/queries/accommodations";

const STATUSES: Accommodation["status"][] = ["programado", "confirmado", "pendiente"];

export function AccommodationFormDialog({
  accommodation,
  open,
  onOpenChange,
}: {
  accommodation: Accommodation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Accommodation["status"]>(accommodation.status);
  const [currency, setCurrency] = useState<Accommodation["currency"] | "none">(accommodation.currency ?? "none");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    await updateAccommodation(accommodation.id, {
      checkIn: formData.get("checkIn") as string,
      checkOut: formData.get("checkOut") as string,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      currency: currency === "none" ? null : currency,
      status: status ?? "pendiente",
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
      confirmationNumber: (formData.get("confirmationNumber") as string) || null,
      roomType: (formData.get("roomType") as string) || null,
      cancellationPolicy: (formData.get("cancellationPolicy") as string) || null,
      phone: (formData.get("phone") as string) || null,
      url: (formData.get("url") as string) || null,
    });

    setSaving(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar alojamiento · {accommodation.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acc-check-in">Entrada</Label>
              <Input id="acc-check-in" name="checkIn" type="date" defaultValue={accommodation.checkIn} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-check-out">Salida</Label>
              <Input id="acc-check-out" name="checkOut" type="date" defaultValue={accommodation.checkOut} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Accommodation["status"])}>
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
              <Label htmlFor="acc-cost">Coste</Label>
              <Input id="acc-cost" name="cost" type="number" step="0.01" defaultValue={accommodation.cost ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={currency ?? "none"} onValueChange={(v) => setCurrency(v as Accommodation["currency"] | "none")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-url">Web oficial</Label>
            <Input
              id="acc-url"
              name="url"
              type="url"
              placeholder="https://…"
              defaultValue={accommodation.url ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-address">Dirección</Label>
            <Input id="acc-address" name="address" defaultValue={accommodation.address ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acc-room-type">Tipo de habitación</Label>
              <Input id="acc-room-type" name="roomType" defaultValue={accommodation.roomType ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-phone">Teléfono</Label>
              <Input id="acc-phone" name="phone" defaultValue={accommodation.phone ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acc-confirmation">Nº de confirmación</Label>
              <Input id="acc-confirmation" name="confirmationNumber" defaultValue={accommodation.confirmationNumber ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-cancellation">Política de cancelación</Label>
              <Input id="acc-cancellation" name="cancellationPolicy" defaultValue={accommodation.cancellationPolicy ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-notes">Notas</Label>
            <Textarea id="acc-notes" name="notes" defaultValue={accommodation.notes ?? ""} rows={3} />
          </div>

          <Button type="submit" disabled={saving} className="rounded-full">
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
