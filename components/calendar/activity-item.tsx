"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { activityImageUrl } from "@/lib/activity-image";
import { typeConfig, statusStyle } from "@/lib/activity-type";
import { ActivityDetailDialog } from "@/components/shared/activity-detail-dialog";
import type { Activity } from "@/lib/queries/days";
import { deleteActivity } from "@/lib/actions/activities";

export function ActivityItem({ activity, onEdit }: { activity: Activity; onEdit: (activity: Activity) => void }) {
  const router = useRouter();
  const [view, setView] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const config = typeConfig[activity.type];

  async function handleDelete() {
    await deleteActivity(activity.id);
    router.refresh();
  }

  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-100 py-4 last:border-0">
      <button onClick={() => setView(true)} className="flex min-w-0 items-start gap-3 text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activityImageUrl(activity, 96)}
          alt=""
          loading="lazy"
          className="size-12 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm">
            {activity.time && <span className="font-mono text-xs text-neutral-400">{activity.time}</span>}
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", config.bg, config.fg)}>
              {config.label}
            </span>
            {activity.status && (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyle[activity.status])}>
                {activity.status}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-neutral-900">{activity.title}</p>
          {activity.description && <p className="line-clamp-2 text-sm text-neutral-500">{activity.description}</p>}
        </div>
      </button>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={() => onEdit(activity)}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)}>
          Borrar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`¿Borrar "${activity.title}"?`}
        onConfirm={handleDelete}
      />

      <ActivityDetailDialog activity={activity} open={view} onOpenChange={setView} />
    </div>
  );
}
