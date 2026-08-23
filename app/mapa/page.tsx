import { getMapMarkers, getMapRoutes } from "@/lib/queries/map";
import { MapLoader } from "@/components/map/map-loader";

export default async function MapaPage() {
  const [markers, routes] = await Promise.all([getMapMarkers(), getMapRoutes()]);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Mapa de rutas</h1>
      <MapLoader markers={markers} routes={routes} />
    </div>
  );
}
