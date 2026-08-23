import { BackupPanel } from "@/components/settings/backup-panel";

export default function AjustesPage() {
  return (
    <div className="space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ajustes</h1>
        <p className="text-sm text-neutral-400">Copia de seguridad de todos los datos del viaje</p>
      </div>
      <BackupPanel />
    </div>
  );
}
