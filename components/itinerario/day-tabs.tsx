"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { ActivityForm } from "@/components/calendar/activity-form";
import { ActivityCard } from "./activity-card";
import { DayForm } from "./day-form";
import { isReadOnly } from "@/lib/env";
import type { DayWithActivities } from "@/lib/queries/days";
import type { CurrencyDisplay } from "@/lib/currency";

export function DayTabs({
  days,
  currencyDisplay,
  accommodationUrls,
  readOnly,
}: {
  days: DayWithActivities[];
  currencyDisplay?: CurrencyDisplay;
  accommodationUrls?: Map<string, string>;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [editingDay, setEditingDay] = useState(false);
  const day = days[index];
  const hideControls = readOnly ?? isReadOnly;

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration-safe flag for the portal target
    setMounted(true);
  }, []);

  function goToIndex(i: number) {
    setIndex(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > 60) return;
    setIndex((i) => (dx < 0 ? Math.min(i + 1, days.length - 1) : Math.max(i - 1, 0)));
  }

  function renderTabButton(d: DayWithActivities, i: number) {
    const pendingCount = d.activities.filter((a) => a.status === "pendiente").length;
    const active = i === index;
    return (
      <button
        onClick={() => setIndex(i)}
        className={cn(
          "flex min-w-23 flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors",
          active
            ? "border-black bg-black text-white"
            : "border-neutral-100 bg-white text-neutral-500 hover:border-neutral-200 hover:text-neutral-900"
        )}
      >
        <span className="flex w-full items-center justify-between gap-2 text-xs font-semibold">
          Día {d.dayNumber}
          {pendingCount > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] font-bold",
                active ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
              )}
            >
              {pendingCount}
            </span>
          )}
        </span>
        <span className={cn("text-[11px]", active ? "text-white/70" : "text-neutral-400")}>
          {d.date.slice(5)}
        </span>
      </button>
    );
  }

  function renderMobileTab(d: DayWithActivities, i: number) {
    const pendingCount = d.activities.filter((a) => a.status === "pendiente").length;
    const active = i === index;
    return (
      <button
        key={d.id}
        onClick={() => goToIndex(i)}
        className={cn(
          "flex shrink-0 snap-start flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          active ? "bg-black text-white" : "text-neutral-500"
        )}
      >
        <span className="flex items-center gap-1">
          Día {d.dayNumber}
          {pendingCount > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] font-bold",
                active ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
              )}
            >
              {pendingCount}
            </span>
          )}
        </span>
        <span className={cn("text-[10px]", active ? "text-white/70" : "text-neutral-400")}>
          {d.date.slice(5)}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <div className="hidden sm:block">
        <Carousel opts={{ align: "start", dragFree: true }} className="mx-10">
          <CarouselContent className="-ml-2">
            {days.map((d, i) => (
              <CarouselItem key={d.id} className="basis-auto pl-2">
                {renderTabButton(d, i)}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {mounted &&
        createPortal(
          <div
            className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.06)] sm:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex snap-x gap-1 overflow-x-auto px-2 py-1.5 scrollbar-none">
              {days.map((d, i) => renderMobileTab(d, i))}
            </div>
          </div>,
          document.body
        )}

      {day && (
        <div className="space-y-5" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900">{day.title}</h2>
                {!hideControls && (
                  <Button size="icon-xs" variant="ghost" onClick={() => setEditingDay(true)} aria-label="Editar día">
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-neutral-400">
                {day.date} · {day.activities.length} {day.activities.length === 1 ? "actividad" : "actividades"}
              </p>
              {day.summary && <p className="mt-2 max-w-3xl text-sm text-neutral-500">{day.summary}</p>}
            </div>
            {!hideControls && (
              <Button size="sm" className="rounded-full" onClick={() => setAdding(true)}>
                <Plus className="size-4" />
                Añadir actividad
              </Button>
            )}
          </div>

          {day.activities.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400">
              Sin actividades este día todavía.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {day.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  currencyDisplay={currencyDisplay}
                  accommodationUrl={activity.type === "hotel" ? accommodationUrls?.get(activity.title) : undefined}
                  readOnly={readOnly}
                />
              ))}
            </div>
          )}

          <Dialog open={adding} onOpenChange={setAdding}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Añadir actividad · Día {day.dayNumber}
                </DialogTitle>
              </DialogHeader>
              <ActivityForm
                dayId={day.id}
                onDone={() => {
                  setAdding(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={editingDay} onOpenChange={setEditingDay}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Editar día {day.dayNumber}</DialogTitle>
              </DialogHeader>
              <DayForm
                day={day}
                onDone={() => {
                  setEditingDay(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
