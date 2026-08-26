"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaEmbed } from "@/components/shared/media-embed";
import { TagList } from "@/components/shared/tag-list";
import type { Note } from "@/lib/queries/notes";

export function NoteDetailDialog({
  note,
  open,
  onOpenChange,
}: {
  note: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {note.mediaUrl && <MediaEmbed url={note.mediaUrl} className="-mx-4 -mt-4 rounded-t-xl" />}
        <DialogHeader>
          <DialogTitle>{note.title}</DialogTitle>
        </DialogHeader>
        <TagList tags={note.tags} />
        {note.body && <p className="whitespace-pre-wrap text-sm text-neutral-600">{note.body}</p>}
      </DialogContent>
    </Dialog>
  );
}
