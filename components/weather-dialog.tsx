"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Cloud,
  Sun,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { weatherCategory, type WeatherInfo } from "@/lib/weather";

const weatherIcon: Record<ReturnType<typeof weatherCategory>, LucideIcon> = {
  clear: Sun,
  cloudy: CloudSun,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

export function WeatherCard({ weather }: { weather: WeatherInfo[] }) {
  const [open, setOpen] = useState(false);

  if (weather.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mx-3 mb-3 space-y-2 rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-left transition-colors hover:bg-neutral-100"
      >
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
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Previsión del tiempo</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 sm:grid-cols-2">
            {weather.map((w) => {
              const CurrentIcon = weatherIcon[weatherCategory(w.weatherCode)];
              return (
                <div key={w.location} className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3">
                    <div className="flex items-center gap-2">
                      <CurrentIcon className="size-6 text-neutral-500" />
                      <span className="text-sm font-semibold text-neutral-900">{w.location}</span>
                    </div>
                    <span className="text-2xl font-bold text-neutral-900">{w.temperature}°C</span>
                  </div>

                  <div className="space-y-1">
                    {w.daily.map((d) => {
                      const DayIcon = weatherIcon[weatherCategory(d.weatherCode)];
                      const label = format(parseISO(d.date), "EEE d", { locale: es });
                      return (
                        <div key={d.date} className="flex items-center justify-between py-1 text-sm">
                          <span className="w-16 shrink-0 text-neutral-500 capitalize">{label}</span>
                          <DayIcon className="size-4 text-neutral-400" />
                          <span className="flex gap-1.5 text-right">
                            <span className="font-semibold text-neutral-900">{d.max}°</span>
                            <span className="text-neutral-400">{d.min}°</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
