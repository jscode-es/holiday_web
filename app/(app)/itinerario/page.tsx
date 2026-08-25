import { getActiveTrip } from "@/lib/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { DayTabs } from "@/components/itinerario/day-tabs";
import { AddDayButton } from "@/components/days/add-day-button";

export default async function ItinerarioPage() {
  const trip = await getActiveTrip();
  if (!trip) return null;
  const days = await getAllDaysWithActivities(trip.id);

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Itinerario</h1>
        <p className="text-sm text-neutral-400">Elige un día para ver sus actividades en detalle</p>
      </div>
      {days.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-400">Este viaje todavía no tiene días.</p>
          <AddDayButton tripId={trip.id} nextDayNumber={1} />
        </div>
      ) : (
        <DayTabs days={days} />
      )}
    </div>
  );
}
