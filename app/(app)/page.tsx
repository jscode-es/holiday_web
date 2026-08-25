import { getActiveTrip } from "@/lib/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { getAllAccommodations } from "@/lib/queries/accommodations";
import { getBudgetSummary } from "@/lib/queries/budget";
import { getMapMarkers, getMapRoutes } from "@/lib/queries/map";
import { StatCard } from "@/components/dashboard/stat-card";
import { ItineraryPanel } from "@/components/dashboard/itinerary-panel";
import { Gallery } from "@/components/dashboard/gallery";
import { MapLoader } from "@/components/map/map-loader";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";
import { convertToDisplay, formatCurrency } from "@/lib/currency";
import Link from "next/link";

export default async function Home() {
  const trip = await getActiveTrip();
  if (!trip) return <EmptyTripsState />;
  const currencyDisplay = { displayCurrency: trip.displayCurrency, eurToJpyRate: trip.eurToJpyRate };

  const [days, accommodations, summary, markers, routes] = await Promise.all([
    getAllDaysWithActivities(trip.id),
    getAllAccommodations(trip.id),
    getBudgetSummary(trip.id),
    getMapMarkers(trip.id),
    getMapRoutes(trip.id),
  ]);

  const convertedTotal =
    trip.displayCurrency && trip.eurToJpyRate
      ? (convertToDisplay(summary.registeredEUR, "EUR", trip.displayCurrency, trip.eurToJpyRate) ?? 0) +
        (convertToDisplay(summary.registeredJPY, "JPY", trip.displayCurrency, trip.eurToJpyRate) ?? 0)
      : null;

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
      : "Define las fechas del viaje en Ajustes para generar los días";

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900">
            {trip.name} {trip.emoji && <span>{trip.emoji}</span>}
          </h1>
          <p className="text-sm text-neutral-400">{dateRange}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registrado (EUR)" value={`${summary.registeredEUR.toFixed(2)} €`} hint="Vuelos y alojamientos" />
        <StatCard label="Registrado (JPY)" value={`¥${summary.registeredJPY.toFixed(0)}`} hint="Extras" />
        <StatCard label="Preparación del viaje" value={`${readiness}%`} hint="Confirmado o programado" />
        <StatCard label="Elementos pendientes" value={String(summary.pendingCount)} hint="Alojamientos y entradas" />
        {convertedTotal != null && (
          <StatCard
            label={`Registrado (${trip.displayCurrency})`}
            value={formatCurrency(convertedTotal, trip.displayCurrency!)}
            hint="Total convertido, todo junto"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
            <ItineraryPanel days={days} currencyDisplay={currencyDisplay} />
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
