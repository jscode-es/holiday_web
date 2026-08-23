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
    <nav className="flex gap-6 border-b px-6 py-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors",
            pathname.startsWith(link.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
