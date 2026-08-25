import { getActiveTrip } from "@/lib/trips";
import { getMapMarkers, getMapRoutes } from "@/lib/queries/map";
import { MapLoader } from "@/components/map/map-loader";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";

export default async function MapaPage() {
  const trip = await getActiveTrip();
  if (!trip) return <EmptyTripsState />;
  const [markers, routes] = await Promise.all([getMapMarkers(trip.id), getMapRoutes(trip.id)]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Mapa de rutas</h1>
        <p className="text-sm text-neutral-400">
          {markers.length} paradas · {routes.length} trayectos
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-100">
        <MapLoader markers={markers} routes={routes} />
      </div>
    </div>
  );
}
