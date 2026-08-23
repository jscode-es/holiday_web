import { getAllDaysWithActivities } from "@/lib/queries/days";
import { getAllAccommodations } from "@/lib/queries/accommodations";
import { getBudgetSummary } from "@/lib/queries/budget";
import { getMapMarkers, getMapRoutes } from "@/lib/queries/map";
import { StatCard } from "@/components/dashboard/stat-card";
import { ItineraryPanel } from "@/components/dashboard/itinerary-panel";
import { Gallery } from "@/components/dashboard/gallery";
import { MapLoader } from "@/components/map/map-loader";

export default async function Home() {
  const [days, accommodations, summary, markers, routes] = await Promise.all([
    getAllDaysWithActivities(),
    getAllAccommodations(),
    getBudgetSummary(),
    getMapMarkers(),
    getMapRoutes(),
  ]);

  const allStatuses = [
    ...days.flatMap((d) => d.activities.map((a) => a.status)),
    ...accommodations.map((a) => a.status),
  ].filter((s): s is NonNullable<typeof s> => s != null);
  const readiness = allStatuses.length
    ? Math.round((allStatuses.filter((s) => s !== "pendiente").length / allStatuses.length) * 100)
    : 0;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900">
            Japón 2026 <span>🇯🇵</span>
          </h1>
          <p className="text-sm text-neutral-400">27 sep — 16 oct 2026 · 20 días · 2 adultos</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600">
            24 sep — 16 oct 2026
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registrado (EUR)" value={`${summary.registeredEUR.toFixed(2)} €`} hint="Vuelos y alojamientos" />
        <StatCard label="Registrado (JPY)" value={`¥${summary.registeredJPY.toFixed(0)}`} hint="DisneySea y extras" />
        <StatCard label="Preparación del viaje" value={`${readiness}%`} hint="Confirmado o programado" />
        <StatCard label="Elementos pendientes" value={String(summary.pendingCount)} hint="Alojamientos y entradas" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ItineraryPanel days={days} />
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
