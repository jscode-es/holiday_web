"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TagList } from "@/components/shared/tag-list";
import { MediaEmbed } from "@/components/shared/media-embed";
import { isReadOnly } from "@/lib/env";
import { deleteUtility } from "@/lib/actions/utilities";
import { UtilityFormDialog } from "@/components/utilities/utility-form-dialog";
import { UtilityDetailDialog } from "@/components/utilities/utility-detail-dialog";
import type { Utility } from "@/lib/queries/utilities";

export function UtilityCard({ utility, tripId }: { utility: Utility; tripId: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    await deleteUtility(utility.id);
    router.refresh();
  }

  return (
    <div className="flex flex-col rounded-xl border border-neutral-100 bg-white p-3">
      <button type="button" className="text-left" onClick={() => setDetailOpen(true)}>
        {utility.mediaUrl && (
          <MediaEmbed url={utility.mediaUrl} className="mb-2 -mx-3 -mt-3 rounded-t-xl" />
        )}
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
              <Lightbulb className="size-3.5" />
            </span>
            <p className="truncate text-sm font-semibold text-neutral-900">{utility.title}</p>
          </div>
        </div>
        <TagList tags={utility.tags} className="mb-1.5" />
        <p className="line-clamp-2 whitespace-pre-wrap text-xs text-neutral-600">
          {utility.description || <span className="text-neutral-400">Sin descripción.</span>}
        </p>
        {utility.url && (
          <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-neutral-500">
            <ExternalLink className="size-3" />
            Más información
          </span>
        )}
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
            aria-label="Borrar utilidad"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}

      <UtilityDetailDialog utility={utility} open={detailOpen} onOpenChange={setDetailOpen} />
      <UtilityFormDialog tripId={tripId} utility={utility} open={editing} onOpenChange={setEditing} />
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`¿Borrar "${utility.title}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
