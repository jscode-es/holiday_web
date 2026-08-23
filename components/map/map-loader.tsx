"use client";

import dynamic from "next/dynamic";
import type { MapMarker, MapRoute } from "@/lib/queries/map";

const RouteMap = dynamic(() => import("./route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <p className="p-6 text-muted-foreground">Cargando mapa…</p>,
});

export function MapLoader({ markers, routes }: { markers: MapMarker[]; routes: MapRoute[] }) {
  return <RouteMap markers={markers} routes={routes} />;
}
