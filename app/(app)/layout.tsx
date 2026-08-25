import { Sidebar } from "@/components/sidebar";
import { getWeather } from "@/lib/weather";
import { getActiveTrip } from "@/lib/trips";
import { getAllTrips } from "@/lib/queries/trips";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [weather, trip, trips] = await Promise.all([getWeather(), getActiveTrip(), getAllTrips()]);

  if (!trip) {
    return <EmptyTripsState />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <Sidebar weather={weather} trip={trip} trips={trips} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
