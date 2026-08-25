import { getActiveTrip } from "@/lib/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { getAllAccommodations } from "@/lib/queries/accommodations";
import { getBudgetSummary } from "@/lib/queries/budget";
import { getMapMarkers, getMapRoutes } from "@/lib/queries/map";
import { StatCard } from "@/components/dashboard/stat-card";
import { ItineraryPanel } from "@/components/dashboard/itinerary-panel";
import { Gallery } from "@/components/dashboard/gallery";
import { MapLoader } from "@/components/map/map-loader";
import { AddDayButton } from "@/components/days/add-day-button";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";

export default async function Home() {
  const trip = await getActiveTrip();
  if (!trip) return <EmptyTripsState />;

  const [days, accommodations, summary, markers, routes] = await Promise.all([
    getAllDaysWithActivities(trip.id),
    getAllAccommodations(trip.id),
    getBudgetSummary(trip.id),
    getMapMarkers(trip.id),
    getMapRoutes(trip.id),
  ]);

  const allStatuses = [
    ...days.flatMap((d) => d.activities.map((a) => a.status)),
    ...accommodations.map((a) => a.status),
  ].filter((s): s is NonNullable<typeof s> => s != null);
  const readiness = allStatuses.length
    ? Math.round((allStatuses.filter((s) => s !== "pendiente").length / allStatuses.length) * 100)
    : 0;

  const dateRange =
    days.length > 0
      ? `${days[0].date} — ${days[days.length - 1].date} · ${days.length} días`
      : trip.startDate && trip.endDate
        ? `${trip.startDate} — ${trip.endDate}`
        : "Añade el primer día para ver las fechas";

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900">
            {trip.name} {trip.emoji && <span>{trip.emoji}</span>}
          </h1>
          <p className="text-sm text-neutral-400">{dateRange}</p>
        </div>
        {days.length > 0 && <AddDayButton tripId={trip.id} nextDayNumber={days.length + 1} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registrado (EUR)" value={`${summary.registeredEUR.toFixed(2)} €`} hint="Vuelos y alojamientos" />
        <StatCard label="Registrado (JPY)" value={`¥${summary.registeredJPY.toFixed(0)}`} hint="Extras" />
        <StatCard label="Preparación del viaje" value={`${readiness}%`} hint="Confirmado o programado" />
        <StatCard label="Elementos pendientes" value={String(summary.pendingCount)} hint="Alojamientos y entradas" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {days.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 py-16 text-center">
              <p className="text-sm text-neutral-400">Este viaje todavía no tiene días.</p>
              <AddDayButton tripId={trip.id} nextDayNumber={1} />
            </div>
          ) : (
            <ItineraryPanel days={days} />
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-100">
          <MapLoader markers={markers} routes={routes} height="320px" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-neutral-900">Galería</p>
        <Gallery />
      </div>
    </div>
  );
}
