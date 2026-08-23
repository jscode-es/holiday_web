"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  Map,
  Bed,
  Wallet,
  Luggage,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { weatherCategory, type WeatherInfo } from "@/lib/weather";

const links = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/itinerario", label: "Itinerario", icon: ListChecks },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/alojamientos", label: "Alojamientos", icon: Bed },
  { href: "/maletas", label: "Maletas", icon: Luggage },
  { href: "/presupuesto", label: "Presupuesto", icon: Wallet },
];

const weatherIcon: Record<ReturnType<typeof weatherCategory>, LucideIcon> = {
  clear: Sun,
  cloudy: CloudSun,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

function WeatherCard({ weather }: { weather: WeatherInfo[] }) {
  if (weather.length === 0) return null;

  return (
    <div className="mx-3 mb-3 space-y-2 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">
        <Cloud className="size-3.5" />
        Tiempo ahora
      </p>
      {weather.map((w) => {
        const Icon = weatherIcon[weatherCategory(w.weatherCode)];
        return (
          <div key={w.location} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <Icon className="size-4 text-neutral-400" />
              {w.location}
            </span>
            <span className="font-semibold text-neutral-900">{w.temperature}°C</span>
          </div>
        );
      })}
    </div>
  );
}

export function Sidebar({ weather }: { weather: WeatherInfo[] }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-100 bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex size-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
          田
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight text-neutral-900">JAPÓN 2026</p>
          <p className="text-xs text-neutral-400">27 sep — 16 oct</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
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

      <WeatherCard weather={weather} />

      <div className="border-t border-neutral-100 px-6 py-4">
        <p className="text-sm font-semibold text-neutral-900">Sergio</p>
        <p className="text-xs text-neutral-400">2 adultos · 20 días</p>
      </div>
    </aside>
  );
}
