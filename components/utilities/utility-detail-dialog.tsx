"use client";

import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TagList } from "@/components/shared/tag-list";
import { MediaEmbed } from "@/components/shared/media-embed";
import type { Utility } from "@/lib/queries/utilities";

export function UtilityDetailDialog({
  utility,
  open,
  onOpenChange,
}: {
  utility: Utility;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {utility.mediaUrl && <MediaEmbed url={utility.mediaUrl} className="-mx-4 -mt-4 rounded-t-xl" />}
        <DialogHeader>
          <DialogTitle>{utility.title}</DialogTitle>
        </DialogHeader>
        <TagList tags={utility.tags} />
        {utility.description && (
          <p className="whitespace-pre-wrap text-sm text-neutral-600">{utility.description}</p>
        )}
        {utility.url && (
          <a
            href={utility.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            <ExternalLink className="size-3.5" />
            Más información
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
