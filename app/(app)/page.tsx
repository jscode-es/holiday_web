import { getActiveTrip } from "@/lib/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { getAllAccommodations } from "@/lib/queries/accommodations";
import { getBudgetSummary } from "@/lib/queries/budget";
import { getMapMarkers, getMapRoutes } from "@/lib/queries/map";
import { ItineraryPanel } from "@/components/dashboard/itinerary-panel";
import { MapLoader } from "@/components/map/map-loader";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function Home() {
  const trip = await getActiveTrip();
  if (!trip) return <EmptyTripsState />;
  const currencyDisplay = { displayCurrency: trip.displayCurrency, eurToJpyRate: trip.eurToJpyRate };

  const [days, accommodations, summary, markers, routes] = await Promise.all([
    getAllDaysWithActivities(trip.id),
    getAllAccommodations(trip.id),
    getBudgetSummary(trip.id, currencyDisplay),
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
      : "Define las fechas del viaje en Ajustes para generar los días";

  const stats =
    summary.registeredConverted != null && trip.displayCurrency
      ? [
          { label: "Preparación del viaje", value: `${readiness}%`, className: "from-emerald-200 to-teal-100" },
          {
            label: "Total registrado",
            value: formatCurrency(summary.registeredConverted, trip.displayCurrency),
            className: "from-amber-200 to-orange-100",
          },
          { label: "Pendientes", value: String(summary.pendingCount), className: "from-rose-200 to-pink-100" },
        ]
      : [
          { label: "Preparación del viaje", value: `${readiness}%`, className: "from-emerald-200 to-teal-100" },
          { label: "Registrado (EUR)", value: `${summary.registeredEUR.toFixed(2)} €`, className: "from-amber-200 to-orange-100" },
          { label: "Registrado (JPY)", value: `¥${summary.registeredJPY.toFixed(0)}`, className: "from-sky-200 to-blue-100" },
          { label: "Pendientes", value: String(summary.pendingCount), className: "from-rose-200 to-pink-100" },
        ];

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

      <div className={cn("grid gap-4 sm:grid-cols-2", stats.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {stats.map((stat) => (
          <div key={stat.label} className={cn("rounded-2xl bg-linear-to-br p-5", stat.className)}>
            <p className="text-xs font-semibold text-neutral-600">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">{stat.value}</p>
          </div>
        ))}
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
          <MapLoader markers={markers} routes={routes} height="100%" />
        </div>
      </div>
    </div>
  );
}
