import { Sidebar } from "@/components/sidebar";
import { getWeather } from "@/lib/weather";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const weather = await getWeather();

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <Sidebar weather={weather} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
