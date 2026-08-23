"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/calendario", label: "Calendario" },
  { href: "/itinerario", label: "Itinerario" },
  { href: "/mapa", label: "Mapa" },
  { href: "/alojamientos", label: "Alojamientos" },
  { href: "/presupuesto", label: "Presupuesto" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between gap-6 border-b border-neutral-100 px-8 py-5">
      <Link href="/calendario" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
          田
        </span>
        <span className="text-sm font-bold tracking-tight text-neutral-900">JAPÓN 2026</span>
      </Link>

      <nav className="flex items-center gap-1 rounded-full bg-neutral-100 p-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-black text-white" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <span className="hidden text-xs font-medium text-neutral-400 sm:block">27 sep — 16 oct</span>
    </header>
  );
}
