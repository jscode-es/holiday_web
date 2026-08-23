import Link from "next/link";
import { getAllAccommodations } from "@/lib/queries/accommodations";
import { AccommodationCard } from "@/components/accommodations/accommodation-card";
import { Button } from "@/components/ui/button";

export default async function AlojamientosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const accommodations = await getAllAccommodations();
  const filtered = status ? accommodations.filter((a) => a.status === status) : accommodations;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Alojamientos</h1>
        <Button size="sm" render={<Link href="/alojamientos/new" />}>
          Añadir alojamiento
        </Button>
      </div>

      <div className="flex gap-2">
        {["confirmado", "programado", "pendiente"].map((s) => (
          <Link
            key={s}
            href={status === s ? "/alojamientos" : `/alojamientos?status=${s}`}
            className="text-sm underline-offset-2 hover:underline"
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((accommodation) => (
          <AccommodationCard key={accommodation.id} accommodation={accommodation} />
        ))}
      </div>
    </div>
  );
}
