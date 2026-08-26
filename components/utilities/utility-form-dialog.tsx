"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TagEditor } from "@/components/shared/tag-editor";
import { createUtility, updateUtility } from "@/lib/actions/utilities";
import type { Utility } from "@/lib/queries/utilities";
import type { Tag } from "@/lib/tags";

export function UtilityFormDialog({
  tripId,
  utility,
  open,
  onOpenChange,
}: {
  tripId: number;
  utility?: Utility;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(utility?.title ?? "");
  const [description, setDescription] = useState(utility?.description ?? "");
  const [url, setUrl] = useState(utility?.url ?? "");
  const [mediaUrl, setMediaUrl] = useState(utility?.mediaUrl ?? "");
  const [tags, setTags] = useState<Tag[]>(utility?.tags ?? []);
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle(utility?.title ?? "");
    setDescription(utility?.description ?? "");
    setUrl(utility?.url ?? "");
    setMediaUrl(utility?.mediaUrl ?? "");
    setTags(utility?.tags ?? []);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    if (utility) {
      await updateUtility(utility.id, trimmed, description, url, mediaUrl, tags);
    } else {
      await createUtility(tripId, trimmed, description, url, mediaUrl, tags);
    }
    setSaving(false);
    if (!utility) {
      setTitle("");
      setDescription("");
      setUrl("");
      setMediaUrl("");
      setTags([]);
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{utility ? "Editar utilidad" : "Nueva utilidad"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="utility-title">Título</Label>
            <Input
              id="utility-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="p. ej. Cómo sacar la Suica"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utility-description">Descripción</Label>
            <Textarea
              id="utility-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utility-url">Enlace (opcional)</Label>
            <Input id="utility-url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utility-media">Imagen o vídeo (opcional)</Label>
            <Input
              id="utility-media"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="URL de imagen o de YouTube"
            />
          </div>
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <TagEditor tags={tags} onChange={setTags} />
          </div>
          <Button type="submit" disabled={saving} className="rounded-full">
            {saving ? "Guardando…" : utility ? "Guardar" : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
