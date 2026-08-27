"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { regenerateShareToken } from "@/lib/actions/trips";
import { isReadOnly } from "@/lib/env";
import type { Trip } from "@/lib/queries/trips";

export function ShareLinkPanel({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  function shareUrl() {
    return `${window.location.origin}/t/${trip.shareToken}/itinerario`;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      await regenerateShareToken(trip.id);
      router.refresh();
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5">
      <p className="mb-3 text-sm font-semibold text-neutral-900">Compartir viaje</p>
      <p className="mb-4 text-sm text-neutral-500">
        Cualquiera con este link puede ver el itinerario, el mapa y el calendario, sin poder editarlos.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {trip.shareToken ? (
          <Button type="button" variant="outline" className="rounded-full" onClick={handleCopy}>
            {copied ? "Copiado" : "Copiar link"}
          </Button>
        ) : (
          <p className="text-sm text-neutral-500">Este viaje no tiene un link de compartir todavía.</p>
        )}
        {!isReadOnly && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            disabled={regenerating}
            onClick={handleRegenerate}
          >
            {regenerating ? "Regenerando…" : "Regenerar link (invalida el anterior)"}
          </Button>
        )}
      </div>
    </div>
  );
}
