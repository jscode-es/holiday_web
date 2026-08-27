"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plane, Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ActivityForm } from "@/components/calendar/activity-form";
import { ActivityDetailDialog } from "@/components/shared/activity-detail-dialog";
import type { CurrencyDisplay } from "@/lib/currency";
import { deleteActivity } from "@/lib/actions/activities";
import { activityImageUrl } from "@/lib/activity-image";
import { typeConfig, statusStyle } from "@/lib/activity-type";
import { convertToDisplay, formatCurrency } from "@/lib/currency";
import { isReadOnly } from "@/lib/env";
import type { Activity } from "@/lib/queries/days";

export function ActivityCard({
  activity,
  currencyDisplay,
  readOnly,
}: {
  activity: Activity;
  currencyDisplay?: CurrencyDisplay;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isLongHaul = activity.type === "transport" && (activity.durationMin ?? 0) >= 360;
  const config = typeConfig[activity.type];
  const Icon = isLongHaul ? Plane : config.icon;
  const hideControls = readOnly ?? isReadOnly;

  const convertedCost =
    activity.cost != null && activity.currency && currencyDisplay
      ? convertToDisplay(activity.cost, activity.currency, currencyDisplay.displayCurrency, currencyDisplay.eurToJpyRate)
      : null;

  async function handleDelete() {
    await deleteActivity(activity.id);
    router.refresh();
  }

  return (
    <div className="group flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4">
      <button onClick={() => setView(true)} className="relative -mx-4 -mt-4 aspect-video w-[calc(100%_+_2rem)] overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activityImageUrl(activity, 480, 270)} alt="" loading="lazy" className="h-full w-full object-cover" />
        <span
          className={cn(
            "absolute top-2 left-2 flex size-8 items-center justify-center rounded-lg backdrop-blur",
            config.bg,
            config.fg
          )}
        >
          <Icon className="size-4" />
        </span>
        {activity.time && (
          <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[11px] text-white">
            {activity.time}
          </span>
        )}
      </button>

      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
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
        {activity.description && <p className="line-clamp-3 text-sm text-neutral-500">{activity.description}</p>}
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        {activity.cost != null ? (
          <span
            className="text-xs font-medium text-neutral-400"
            title={convertedCost != null ? `Original: ${activity.cost} ${activity.currency}` : undefined}
          >
            {convertedCost != null
              ? formatCurrency(convertedCost, currencyDisplay!.displayCurrency!)
              : `${activity.cost} ${activity.currency}`}
          </span>
        ) : (
          <span />
        )}
        <div className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button size="icon-xs" variant="ghost" onClick={() => setView(true)} aria-label="Ver más">
            <Eye className="size-3.5" />
          </Button>
          {!hideControls && (
            <>
              <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} aria-label="Editar">
                <Pencil className="size-3.5" />
              </Button>
              <Button size="icon-xs" variant="ghost" onClick={() => setConfirmingDelete(true)} aria-label="Borrar">
                <Trash2 className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`¿Borrar "${activity.title}"?`}
        onConfirm={handleDelete}
      />

      <ActivityDetailDialog activity={activity} open={view} onOpenChange={setView} currencyDisplay={currencyDisplay} />

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar actividad</DialogTitle>
          </DialogHeader>
          <ActivityForm
            dayId={activity.dayId}
            activity={activity}
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
