import { notFound } from "next/navigation";
import { getTripByShareToken } from "@/lib/queries/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { getAllAccommodations } from "@/lib/queries/accommodations";
import { DayTabs } from "@/components/itinerario/day-tabs";

export default async function PublicItinerarioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const trip = await getTripByShareToken(token);
  if (!trip) notFound();
  const [days, accommodations] = await Promise.all([
    getAllDaysWithActivities(trip.id),
    getAllAccommodations(trip.id),
  ]);
  const currencyDisplay = { displayCurrency: trip.displayCurrency, eurToJpyRate: trip.eurToJpyRate };
  const accommodationUrls = new Map(accommodations.filter((a) => a.url).map((a) => [a.name, a.url as string]));

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Itinerario</h1>
      </div>
      {days.length === 0 ? (
        <p className="text-sm text-neutral-400">Este viaje todavía no tiene días.</p>
      ) : (
        <DayTabs days={days} currencyDisplay={currencyDisplay} accommodationUrls={accommodationUrls} readOnly />
      )}
    </div>
  );
}
