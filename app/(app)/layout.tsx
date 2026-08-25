import { Sidebar } from "@/components/sidebar";
import { getWeather } from "@/lib/weather";
import { getActiveTrip } from "@/lib/trips";
import { getAllTrips } from "@/lib/queries/trips";
import { getAllDays } from "@/lib/queries/days";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [weather, trip, trips] = await Promise.all([getWeather(), getActiveTrip(), getAllTrips()]);
  const dayCount = trip ? (await getAllDays(trip.id)).length : 0;

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <Sidebar weather={weather} trip={trip} trips={trips} dayCount={dayCount} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
