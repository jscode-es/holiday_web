import Link from "next/link";
import { getAllAccommodations } from "@/lib/queries/accommodations";
import { AccommodationCard } from "@/components/accommodations/accommodation-card";
import { AddAccommodationButton } from "@/components/accommodations/add-accommodation-button";
import { cn } from "@/lib/utils";

const statuses = ["confirmado", "programado", "pendiente"];

export default async function AlojamientosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const accommodations = await getAllAccommodations();
  const filtered = status ? accommodations.filter((a) => a.status === status) : accommodations;

  return (
    <div className="space-y-6 px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Alojamientos</h1>
          <p className="text-sm text-neutral-400">{accommodations.length} reservas para el viaje</p>
        </div>
        <AddAccommodationButton />
      </div>

      <div className="flex gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={status === s ? "/alojamientos" : `/alojamientos?status=${s}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              status === s ? "bg-black text-white" : "bg-neutral-100 text-neutral-500 hover:text-neutral-900"
            )}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((accommodation, index) => (
          <AccommodationCard key={accommodation.id} accommodation={accommodation} index={index} />
        ))}
      </div>
    </div>
  );
}
