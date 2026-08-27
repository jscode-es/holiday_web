import { getActiveTrip } from "@/lib/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { getAllAccommodations } from "@/lib/queries/accommodations";
import { DayTabs } from "@/components/itinerario/day-tabs";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";
import Link from "next/link";

export default async function ItinerarioPage() {
  const trip = await getActiveTrip();
  if (!trip) return <EmptyTripsState />;
  const [days, accommodations] = await Promise.all([
    getAllDaysWithActivities(trip.id),
    getAllAccommodations(trip.id),
  ]);
  const currencyDisplay = { displayCurrency: trip.displayCurrency, eurToJpyRate: trip.eurToJpyRate };
  const accommodationUrls = new Map(accommodations.filter((a) => a.url).map((a) => [a.name, a.url as string]));

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Itinerario</h1>
        <p className="text-sm text-neutral-400">Elige un día para ver sus actividades en detalle</p>
      </div>
      {days.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-400">
            Este viaje todavía no tiene días. Ve a{" "}
            <Link href="/ajustes" className="font-medium text-neutral-700 underline underline-offset-2">
              Ajustes
            </Link>{" "}
            y define la fecha de inicio y fin para generarlos.
          </p>
        </div>
      ) : (
        <DayTabs days={days} currencyDisplay={currencyDisplay} accommodationUrls={accommodationUrls} />
      )}
    </div>
  );
}
