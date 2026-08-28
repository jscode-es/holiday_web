"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { ImageUploader } from "@/components/shared/image-uploader";
import { LocationSearch, type LocationValue } from "@/components/shared/location-search";
import { AccommodationFormDialog } from "@/components/shared/accommodation-form-dialog";
import { youtubeVideoId } from "@/lib/youtube";
import type { Activity } from "@/lib/queries/days";
import type { Accommodation } from "@/lib/queries/accommodations";
import { createActivity, updateActivity, type ActivityInput } from "@/lib/actions/activities";
import { findAccommodationByName } from "@/lib/actions/accommodations";

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
  const [imageUrl, setImageUrl] = useState(activity?.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(activity?.videoUrl ?? "");
  const [url, setUrl] = useState(activity?.url ?? "");
  const [originLoc, setOriginLoc] = useState<LocationValue | null>(
    activity?.originLat != null && activity?.originLng != null
      ? { label: activity.origin ?? "", lat: activity.originLat, lng: activity.originLng }
      : null
  );
  const [destLoc, setDestLoc] = useState<LocationValue | null>(
    activity?.destLat != null && activity?.destLng != null
      ? { label: activity.destination ?? activity.title, lat: activity.destLat, lng: activity.destLng }
      : null
  );
  const [saving, setSaving] = useState(false);
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [editingAccommodation, setEditingAccommodation] = useState(false);

  useEffect(() => {
    if (type !== "hotel" || !activity) return;
    let cancelled = false;
    findAccommodationByName(activity.title, activity.dayId).then((result) => {
      if (!cancelled) setAccommodation(result);
    });
    return () => {
      cancelled = true;
    };
  }, [type, activity]);

  const videoUrlInvalid = videoUrl.trim() !== "" && !youtubeVideoId(videoUrl.trim());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    const fields = {
      dayId,
      time: (formData.get("time") as string) || null,
      type,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      status,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      currency: (formData.get("currency") as ActivityInput["currency"]) || null,
      durationMin: formData.get("durationMin") ? Number(formData.get("durationMin")) : null,
      origin: type === "transport" ? (originLoc?.label ?? null) : type === "place" ? null : (formData.get("origin") as string) || null,
      destination:
        type === "place" || type === "transport"
          ? (destLoc?.label ?? null)
          : (formData.get("destination") as string) || null,
      originLat: type === "transport" ? (originLoc?.lat ?? null) : null,
      originLng: type === "transport" ? (originLoc?.lng ?? null) : null,
      destLat: type === "place" || type === "transport" ? (destLoc?.lat ?? null) : null,
      destLng: type === "place" || type === "transport" ? (destLoc?.lng ?? null) : null,
      imageUrl: imageUrl.trim() || null,
      videoUrl: !videoUrlInvalid && videoUrl.trim() ? videoUrl.trim() : null,
      url: url.trim() || null,
    };

    if (activity) {
      // Via (scale) coordinates aren't editable in this form, so they're
      // omitted from the partial update rather than nulled out.
      await updateActivity(activity.id, fields);
    } else {
      await createActivity({ ...fields, viaLabel: null, viaLat: null, viaLng: null });
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

      <div className="space-y-2">
        <Label>Imagen de referencia</Label>
        <ImageUploader value={imageUrl} onChange={setImageUrl} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoUrl">Vídeo de YouTube (URL)</Label>
        <Input
          id="videoUrl"
          name="videoUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          aria-invalid={videoUrlInvalid}
        />
        {videoUrlInvalid && (
          <p className="text-xs text-rose-600">No parece un enlace de YouTube válido.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Enlace (más información)</Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
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

      <div className={cn("grid gap-4", type === "place" ? "grid-cols-2" : "grid-cols-3")}>
        <div className="space-y-2">
          <Label htmlFor="durationMin">Duración (min)</Label>
          <Input id="durationMin" name="durationMin" type="number" defaultValue={activity?.durationMin ?? ""} />
        </div>
        {type === "place" ? (
          <div className="space-y-2">
            <Label>Ubicación</Label>
            <LocationSearch value={destLoc} onChange={setDestLoc} placeholder="Buscar lugar o dirección…" />
          </div>
        ) : type === "transport" ? (
          <>
            <div className="space-y-2">
              <Label>Origen</Label>
              <LocationSearch value={originLoc} onChange={setOriginLoc} placeholder="Buscar origen…" />
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <LocationSearch value={destLoc} onChange={setDestLoc} placeholder="Buscar destino…" />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="origin">Origen</Label>
              <Input id="origin" name="origin" defaultValue={activity?.origin ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destino</Label>
              <Input id="destination" name="destination" defaultValue={activity?.destination ?? ""} />
            </div>
          </>
        )}
      </div>

      {type === "hotel" && accommodation && (
        <Button type="button" variant="outline" onClick={() => setEditingAccommodation(true)}>
          <Pencil className="size-3.5" />
          Editar datos del alojamiento
        </Button>
      )}

      <Button type="submit" disabled={saving} className="rounded-full">
        {saving ? "Guardando…" : activity ? "Guardar cambios" : "Añadir actividad"}
      </Button>

      {accommodation && (
        <AccommodationFormDialog
          accommodation={accommodation}
          open={editingAccommodation}
          onOpenChange={setEditingAccommodation}
        />
      )}
    </form>
  );
}
