"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TagList } from "@/components/shared/tag-list";
import { MediaEmbed } from "@/components/shared/media-embed";
import { isReadOnly } from "@/lib/env";
import { deleteNote } from "@/lib/actions/notes";
import { NoteFormDialog } from "@/components/notes/note-form-dialog";
import { NoteDetailDialog } from "@/components/notes/note-detail-dialog";
import type { Note } from "@/lib/queries/notes";

export function NoteCard({ note, tripId }: { note: Note; tripId: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    await deleteNote(note.id);
    router.refresh();
  }

  return (
    <div className="flex flex-col rounded-xl border border-neutral-100 bg-white p-3">
      <button type="button" className="text-left" onClick={() => setDetailOpen(true)}>
        {note.mediaUrl && <MediaEmbed url={note.mediaUrl} className="mb-2 -mx-3 -mt-3 rounded-t-xl" />}
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
              <StickyNote className="size-3.5" />
            </span>
            <p className="truncate text-sm font-semibold text-neutral-900">{note.title}</p>
          </div>
        </div>
        <TagList tags={note.tags} className="mb-1.5" />
        <p className="line-clamp-2 whitespace-pre-wrap text-xs text-neutral-600">
          {note.body || <span className="text-neutral-400">Sin contenido.</span>}
        </p>
      </button>

      {!isReadOnly && (
        <div className="mt-2 flex justify-end gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            aria-label="Editar"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            aria-label="Borrar nota"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}

      <NoteDetailDialog note={note} open={detailOpen} onOpenChange={setDetailOpen} />
      <NoteFormDialog tripId={tripId} note={note} open={editing} onOpenChange={setEditing} />
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`¿Borrar "${note.title}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
