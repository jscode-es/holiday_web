import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Accommodation } from "@/lib/queries/accommodations";

const statusStyle: Record<string, string> = {
  pendiente: "bg-rose-100 text-rose-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  programado: "bg-neutral-100 text-neutral-600",
};

const cardGradients = ["from-amber-200 to-orange-100", "from-sky-200 to-blue-100", "from-emerald-200 to-teal-100"];

export function AccommodationCard({ accommodation, index = 0 }: { accommodation: Accommodation; index?: number }) {
  const gradient = cardGradients[index % cardGradients.length];

  return (
    <Link
      href={`/alojamientos/${accommodation.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow hover:shadow-md"
    >
      <div className={cn("relative flex h-32 items-start justify-between bg-linear-to-br p-3", gradient)}>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur",
            statusStyle[accommodation.status]
          )}
        >
          {accommodation.status}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-sm font-semibold text-neutral-900 group-hover:text-black">{accommodation.name}</p>
        <p className="text-xs text-neutral-400">
          {accommodation.checkIn} → {accommodation.checkOut}
        </p>
        {accommodation.cost != null ? (
          <p className="text-sm font-bold text-neutral-900">
            {accommodation.cost} <span className="text-xs font-medium text-neutral-400">{accommodation.currency}</span>
          </p>
        ) : (
          <p className="text-sm font-medium text-neutral-400">Coste por confirmar</p>
        )}
      </div>
    </Link>
  );
}
