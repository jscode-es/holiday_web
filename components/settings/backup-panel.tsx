"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function BackupPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function handleImportFile(file: File) {
    setResult(null);
    setImporting(true);
    try {
      const text = await file.text();
      const body = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al importar la copia de seguridad.");

      setResult({ ok: true, message: "Importación completada. Recargando datos…" });
      router.refresh();
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Error al importar." });
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-neutral-100 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Download className="size-4" />
          </span>
          <p className="text-sm font-semibold text-neutral-900">Exportar copia de seguridad</p>
        </div>
        <p className="mb-4 text-sm text-neutral-500">
          Descarga todos los datos del viaje (días, actividades, alojamientos, maletas y checklist) en un archivo
          JSON. Guárdalo como copia de seguridad o úsalo para cargar los mismos datos en otra instalación de la web.
        </p>
        <Button className="rounded-full" nativeButton={false} render={<a href="/api/export" download />}>
          <Download className="size-4" />
          Descargar JSON
        </Button>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Upload className="size-4" />
          </span>
          <p className="text-sm font-semibold text-neutral-900">Importar copia de seguridad</p>
        </div>
        <p className="mb-4 text-sm text-neutral-500">
          Sube un archivo exportado desde aquí. <strong>Sustituye todos los datos actuales</strong> — pensado para
          cargar los datos por primera vez en una web nueva sin datos iniciales, o para restaurar una copia.
        </p>
        <Button
          variant="outline"
          className="rounded-full"
          disabled={importing}
          onClick={() => inputRef.current?.click()}
        >
          {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {importing ? "Importando…" : "Elegir archivo JSON"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPendingFile(file);
            e.target.value = "";
          }}
        />
        {result && (
          <p
            className={`mt-3 flex items-center gap-1.5 text-sm ${result.ok ? "text-emerald-700" : "text-rose-600"}`}
          >
            {result.ok ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
            {result.message}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingFile != null}
        onOpenChange={(open) => !open && setPendingFile(null)}
        title="¿Importar copia de seguridad?"
        description="Reemplazará TODOS los datos actuales de la web (días, actividades, alojamientos, maletas, checklist) por los del archivo."
        confirmLabel="Importar"
        onConfirm={async () => {
          if (pendingFile) await handleImportFile(pendingFile);
        }}
      />
    </div>
  );
}
