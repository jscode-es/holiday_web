"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import type { MapMarker, MapRoute } from "@/lib/queries/map";

const icon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function RouteMap({
  markers,
  routes,
  height = "70vh",
}: {
  markers: MapMarker[];
  routes: MapRoute[];
  height?: string;
}) {
  const center: [number, number] = markers.length ? [markers[0].lat, markers[0].lng] : [35.6812, 139.7671];

  return (
    <MapContainer center={center} zoom={6} style={{ height, width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={icon}>
          <Popup>{marker.title}</Popup>
        </Marker>
      ))}
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={[
            [route.originLat, route.originLng],
            [route.destLat, route.destLng],
          ]}
          pathOptions={{ color: "#2563eb", weight: 3 }}
        />
      ))}
    </MapContainer>
  );
}
