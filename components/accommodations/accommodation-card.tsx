"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AccommodationForm } from "./accommodation-form";
import { deleteAccommodation } from "@/lib/actions/accommodations";
import { googleMapsUrl } from "@/lib/google-maps";
import type { Accommodation } from "@/lib/queries/accommodations";

const statusStyle: Record<string, string> = {
  pendiente: "bg-rose-100 text-rose-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  programado: "bg-neutral-100 text-neutral-600",
};

const cardGradients = ["from-amber-200 to-orange-100", "from-sky-200 to-blue-100", "from-emerald-200 to-teal-100"];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm last:border-0">
      <span className="text-neutral-400">{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}

export function AccommodationCard({ accommodation, index = 0 }: { accommodation: Accommodation; index?: number }) {
  const router = useRouter();
  const [view, setView] = useState(false);
  const [editing, setEditing] = useState(false);
  const gradient = cardGradients[index % cardGradients.length];
  const mapsUrl = googleMapsUrl(accommodation);

  async function handleDelete() {
    if (!window.confirm(`¿Borrar "${accommodation.name}"?`)) return;
    await deleteAccommodation(accommodation.id);
    router.refresh();
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow hover:shadow-md">
      <button onClick={() => setView(true)} className="flex flex-col text-left">
        <div className={cn("relative flex h-32 items-start justify-between bg-linear-to-br p-3", gradient)}>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur", statusStyle[accommodation.status])}>
            {accommodation.status}
          </span>
        </div>
        <div className="space-y-2 p-4 pb-2">
          <p className="text-sm font-semibold text-neutral-900 group-hover:text-black">{accommodation.name}</p>
          <p className="text-xs text-neutral-400">
            {accommodation.checkIn} → {accommodation.checkOut}
          </p>
          {accommodation.cost != null ? (
            <p className="text-sm font-bold text-neutral-900">
              {accommodation.cost} <span className="text-xs font-medium text-neutral-400">{accommodation.currency}</span>
            </p>
          ) : (
            <p className="text-sm font-medium text-neutral-400">Coste por confirmar</p>
          )}
        </div>
      </button>

      <div className="flex items-center justify-end gap-1 border-t border-neutral-50 px-2 py-1">
        <Button size="icon-xs" variant="ghost" onClick={() => setView(true)} aria-label="Ver más">
          <Eye className="size-3.5" />
        </Button>
        <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} aria-label="Editar">
          <Pencil className="size-3.5" />
        </Button>
        <Button size="icon-xs" variant="ghost" onClick={handleDelete} aria-label="Borrar">
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <Dialog open={view} onOpenChange={setView}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{accommodation.name}</DialogTitle>
          </DialogHeader>
          <div>
            <DetailRow label="Estado" value={accommodation.status} />
            <DetailRow label="Check-in" value={accommodation.checkIn} />
            <DetailRow label="Check-out" value={accommodation.checkOut} />
            {accommodation.nights != null && <DetailRow label="Noches" value={String(accommodation.nights)} />}
            {accommodation.cost != null && (
              <DetailRow label="Coste" value={`${accommodation.cost} ${accommodation.currency ?? ""}`} />
            )}
            {accommodation.roomType && <DetailRow label="Habitación" value={accommodation.roomType} />}
            {accommodation.confirmationNumber && (
              <DetailRow label="Nº de confirmación" value={accommodation.confirmationNumber} />
            )}
            {accommodation.cancellationPolicy && (
              <DetailRow label="Cancelación" value={accommodation.cancellationPolicy} />
            )}
            {accommodation.phone && <DetailRow label="Teléfono" value={accommodation.phone} />}
            {accommodation.address && <DetailRow label="Dirección" value={accommodation.address} />}
            {accommodation.notes && <DetailRow label="Notas" value={accommodation.notes} />}
          </div>
          <div className="flex gap-2">
            {mapsUrl && (
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                nativeButton={false}
                render={<a href={mapsUrl} target="_blank" rel="noopener noreferrer" />}
              >
                <MapPin className="size-4" />
                Google Maps
              </Button>
            )}
            {accommodation.phone && (
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                nativeButton={false}
                render={<a href={`tel:${accommodation.phone}`} />}
              >
                <Phone className="size-4" />
                Llamar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar alojamiento</DialogTitle>
          </DialogHeader>
          <AccommodationForm
            accommodation={accommodation}
            onDone={() => {
              setEditing(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
