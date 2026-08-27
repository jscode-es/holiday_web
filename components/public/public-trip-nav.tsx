"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "itinerario", label: "Itinerario" },
  { href: "mapa", label: "Mapa" },
  { href: "calendario", label: "Calendario" },
];

export function PublicTripNav({ token }: { token: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-neutral-100 bg-white px-4 sm:px-6">
      {TABS.map((tab) => {
        const href = `/t/${token}/${tab.href}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "border-b-2 px-3 py-2.5 text-sm font-medium",
              active ? "border-black text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-700"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
