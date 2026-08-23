"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, ListChecks, Map, Bed, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/itinerario", label: "Itinerario", icon: ListChecks },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/alojamientos", label: "Alojamientos", icon: Bed },
  { href: "/presupuesto", label: "Presupuesto", icon: Wallet },
];

export function Sidebar() {
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

      <div className="border-t border-neutral-100 px-6 py-4">
        <p className="text-sm font-semibold text-neutral-900">Sergio</p>
        <p className="text-xs text-neutral-400">2 adultos · 20 días</p>
      </div>
    </aside>
  );
}
