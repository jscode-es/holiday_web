import { notFound } from "next/navigation";
import { getTripByShareToken } from "@/lib/queries/trips";
import { PublicTripNav } from "@/components/public/public-trip-nav";

export default async function PublicTripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const trip = await getTripByShareToken(token);
  if (!trip) notFound();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          {trip.emoji && <span className="text-xl">{trip.emoji}</span>}
          <span className="font-bold text-neutral-900">{trip.name}</span>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
          Vista de solo lectura
        </span>
      </header>
      <PublicTripNav token={token} />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
