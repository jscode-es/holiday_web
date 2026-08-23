import { getAllDaysWithActivities } from "@/lib/queries/days";
import { DayTabs } from "@/components/itinerario/day-tabs";

export default async function ItinerarioPage() {
  const days = await getAllDaysWithActivities();

  return (
    <div className="space-y-8 px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Itinerario</h1>
        <p className="text-sm text-neutral-400">Elige un día para ver sus actividades en detalle</p>
      </div>
      <DayTabs days={days} />
    </div>
  );
}
