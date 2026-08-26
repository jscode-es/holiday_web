"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TagEditor } from "@/components/shared/tag-editor";
import { createNote, updateNote } from "@/lib/actions/notes";
import type { Note } from "@/lib/queries/notes";
import type { Tag } from "@/lib/tags";

export function NoteFormDialog({
  tripId,
  note,
  open,
  onOpenChange,
}: {
  tripId: number;
  note?: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [mediaUrl, setMediaUrl] = useState(note?.mediaUrl ?? "");
  const [tags, setTags] = useState<Tag[]>(note?.tags ?? []);
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setMediaUrl(note?.mediaUrl ?? "");
    setTags(note?.tags ?? []);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    if (note) {
      await updateNote(note.id, trimmed, body, mediaUrl, tags);
    } else {
      await createNote(tripId, trimmed, body, mediaUrl, tags);
    }
    setSaving(false);
    if (!note) {
      setTitle("");
      setBody("");
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
          <DialogTitle>{note ? "Editar nota" : "Nueva nota"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="note-title">Título</Label>
            <Input id="note-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-body">Nota</Label>
            <Textarea
              id="note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Escribe tu nota…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-media">Imagen o vídeo (opcional)</Label>
            <Input
              id="note-media"
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
            {saving ? "Guardando…" : note ? "Guardar" : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
