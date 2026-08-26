import { getActiveTrip } from "@/lib/trips";
import { getAllUtilities } from "@/lib/queries/utilities";
import { UtilityCard } from "@/components/utilities/utility-card";
import { AddUtilityButton } from "@/components/utilities/add-utility-button";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";

export default async function UtilidadesPage() {
  const trip = await getActiveTrip();
  if (!trip) return <EmptyTripsState />;
  const utilities = await getAllUtilities(trip.id);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Utilidades</h1>
          <p className="text-sm text-neutral-400">
            {utilities.length} {utilities.length === 1 ? "utilidad" : "utilidades"}
          </p>
        </div>
        <AddUtilityButton tripId={trip.id} />
      </div>

      {utilities.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 py-16 text-center text-sm text-neutral-400">
          Todavía no has añadido ninguna utilidad. Crea la primera con &quot;Nueva utilidad&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {utilities.map((utility) => (
            <UtilityCard key={utility.id} utility={utility} tripId={trip.id} />
          ))}
        </div>
      )}
    </div>
  );
}
