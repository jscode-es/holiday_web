import { getActiveTrip } from "@/lib/trips";
import { getAllBagsWithItems } from "@/lib/queries/bags";
import { BagCard } from "@/components/bags/bag-card";
import { AddBagButton } from "@/components/bags/add-bag-button";

export default async function MaletasPage() {
  const trip = await getActiveTrip();
  if (!trip) return null;
  const bags = await getAllBagsWithItems(trip.id);
  const totalItems = bags.reduce((acc, b) => acc + b.items.length, 0);
  const packedItems = bags.reduce((acc, b) => acc + b.items.filter((i) => i.packed).length, 0);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Maletas</h1>
          <p className="text-sm text-neutral-400">
            {bags.length} {bags.length === 1 ? "maleta" : "maletas"}
            {totalItems > 0 && ` · ${packedItems}/${totalItems} preparado`}
          </p>
        </div>
        <AddBagButton tripId={trip.id} />
      </div>

      {bags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 py-16 text-center text-sm text-neutral-400">
          Todavía no has añadido ninguna maleta. Crea la primera con &quot;Nueva maleta&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bags.map((bag) => (
            <BagCard key={bag.id} bag={bag} />
          ))}
        </div>
      )}
    </div>
  );
}
