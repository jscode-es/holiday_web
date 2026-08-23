/** Builds a Google Maps search URL from coordinates when available, falling back to the address text. */
export function googleMapsUrl({
  lat,
  lng,
  address,
}: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
}): string | null {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return null;
}
