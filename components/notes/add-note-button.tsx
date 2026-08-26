"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteFormDialog } from "@/components/notes/note-form-dialog";
import { isReadOnly } from "@/lib/env";

export function AddNoteButton({ tripId }: { tripId: number }) {
  const [open, setOpen] = useState(false);

  if (isReadOnly) return null;

  return (
    <>
      <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nueva nota
      </Button>
      <NoteFormDialog tripId={tripId} open={open} onOpenChange={setOpen} />
    </>
  );
}
