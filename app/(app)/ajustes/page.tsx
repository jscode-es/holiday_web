import { getActiveTrip } from "@/lib/trips";
import { getAllDays } from "@/lib/queries/days";
import { BackupPanel } from "@/components/settings/backup-panel";
import { LogoutButton } from "@/components/settings/logout-button";
import { TripSettingsForm } from "@/components/trips/trip-settings-form";

export default async function AjustesPage() {
  const trip = await getActiveTrip();
  const days = trip ? await getAllDays(trip.id) : [];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ajustes</h1>
        <p className="text-sm text-neutral-400">Datos del viaje y copia de seguridad</p>
      </div>

      {trip && (
        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-neutral-900">Datos del viaje</p>
          <p className="mb-4 text-sm text-neutral-500">
            Los días del itinerario se generan automáticamente a partir de la fecha de inicio y fin. Si acortas el
            rango, los días que queden fuera se borran junto con sus actividades.
          </p>
          <TripSettingsForm trip={trip} days={days} />
        </div>
      )}

      <BackupPanel />

      <div className="rounded-2xl border border-neutral-100 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-neutral-900">Cuenta</p>
        <LogoutButton />
      </div>
    </div>
  );
}
