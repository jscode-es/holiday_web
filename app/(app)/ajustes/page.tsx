import { BackupPanel } from "@/components/settings/backup-panel";
import { LogoutButton } from "@/components/settings/logout-button";

export default function AjustesPage() {
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ajustes</h1>
        <p className="text-sm text-neutral-400">Copia de seguridad de todos los datos del viaje</p>
      </div>
      <BackupPanel />

      <div className="rounded-2xl border border-neutral-100 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-neutral-900">Cuenta</p>
        <LogoutButton />
      </div>
    </div>
  );
}
