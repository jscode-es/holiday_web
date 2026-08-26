"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  Map,
  Luggage,
  Wallet,
  StickyNote,
  Lightbulb,
  Settings,
  Menu,
  X,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WeatherCard } from "@/components/weather-dialog";
import { TripSwitcher } from "@/components/trips/trip-switcher";
import { isReadOnly } from "@/lib/env";
import type { WeatherInfo } from "@/lib/weather";
import type { Trip } from "@/lib/queries/trips";

const links = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/itinerario", label: "Itinerario", icon: ListChecks },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/maletas", label: "Maletas", icon: Luggage },
  { href: "/presupuesto", label: "Presupuesto", icon: Wallet },
  { href: "/notas", label: "Notas", icon: StickyNote },
  { href: "/utilidades", label: "Utilidades", icon: Lightbulb },
];

export function Sidebar({
  weather,
  trip,
  trips,
  dayCount,
}: {
  weather: WeatherInfo[];
  trip: Trip | null;
  trips: Trip[];
  dayCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 bg-white px-4 py-3 md:hidden">
        <div className="min-w-0 flex-1">
          {trip ? (
            <TripSwitcher activeTrip={trip} trips={trips} />
          ) : (
            <div className="flex items-center gap-2 px-1 py-1">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                🧳
              </span>
              <p className="truncate text-sm font-semibold text-neutral-400">Sin viajes todavía</p>
            </div>
          )}
        </div>
        <Button size="icon-sm" variant="ghost" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <Menu className="size-5" />
        </Button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-72 -translate-x-full flex-col border-r border-neutral-100 bg-white transition-transform duration-200 ease-in-out",
          open && "translate-x-0",
          "md:static md:z-auto md:w-64 md:shrink-0 md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-6 py-6">
          <div className="min-w-0 flex-1">
            {trip ? (
              <TripSwitcher activeTrip={trip} trips={trips} />
            ) : (
              <div className="flex items-center gap-2 px-1 py-1">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                  🧳
                </span>
                <p className="truncate text-sm font-semibold text-neutral-400">Sin viajes todavía</p>
              </div>
            )}
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            className="md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">Menú</p>
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {isReadOnly && (
          <p className="mx-3 mb-3 flex items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <Eye className="size-3.5 shrink-0" />
            Solo lectura — edita en local
          </p>
        )}

        <WeatherCard weather={weather} />

        <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Sergio</p>
            {trip && (trip.travelers != null || dayCount > 0) && (
              <p className="text-xs text-neutral-400">
                {trip.travelers != null && `${trip.travelers} ${trip.travelers === 1 ? "adulto" : "adultos"}`}
                {trip.travelers != null && dayCount > 0 && " · "}
                {dayCount > 0 && `${dayCount} ${dayCount === 1 ? "día" : "días"}`}
              </p>
            )}
          </div>
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-colors",
              pathname === "/ajustes" ? "bg-black text-white" : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
            )}
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </aside>
    </>
  );
}
