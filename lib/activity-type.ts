import {
  TrainFront,
  MapPin,
  Ticket,
  UtensilsCrossed,
  StickyNote,
  AlertTriangle,
  Bed,
  type LucideIcon,
} from "lucide-react";
import type { Activity } from "@/lib/queries/days";

export const typeConfig: Record<Activity["type"], { label: string; icon: LucideIcon; bg: string; fg: string }> = {
  transport: { label: "Transporte", icon: TrainFront, bg: "bg-sky-50", fg: "text-sky-700" },
  place: { label: "Lugar", icon: MapPin, bg: "bg-emerald-50", fg: "text-emerald-700" },
  event: { label: "Evento", icon: Ticket, bg: "bg-violet-50", fg: "text-violet-700" },
  comida: { label: "Comida", icon: UtensilsCrossed, bg: "bg-amber-50", fg: "text-amber-700" },
  nota: { label: "Nota", icon: StickyNote, bg: "bg-neutral-100", fg: "text-neutral-600" },
  aviso: { label: "Aviso", icon: AlertTriangle, bg: "bg-rose-50", fg: "text-rose-700" },
  hotel: { label: "Hotel", icon: Bed, bg: "bg-neutral-900", fg: "text-white" },
};

export const statusStyle: Record<string, string> = {
  pendiente: "bg-rose-100 text-rose-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  programado: "bg-neutral-100 text-neutral-600",
};
