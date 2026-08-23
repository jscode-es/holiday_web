import { getAllDaysWithActivities } from "@/lib/queries/days";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const typeLabel: Record<string, string> = {
  transport: "Transporte",
  place: "Lugar",
  event: "Evento",
  comida: "Comida",
  nota: "Nota",
  aviso: "Aviso",
  hotel: "Hotel",
};

export default async function ItinerarioPage() {
  const days = await getAllDaysWithActivities();

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-6">
      <h1 className="text-2xl font-semibold">Itinerario</h1>
      {days.map((day) => (
        <section key={day.id} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">
              Día {day.dayNumber} · {day.date} · {day.title}
            </h2>
            {day.summary && <p className="text-sm text-muted-foreground">{day.summary}</p>}
          </div>
          <Separator />
          <div className="space-y-3">
            {day.activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <span className="w-12 shrink-0 font-mono text-sm text-muted-foreground">{activity.time ?? "—"}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{typeLabel[activity.type]}</Badge>
                    {activity.status && <Badge variant="outline">{activity.status}</Badge>}
                    <span className="font-medium">{activity.title}</span>
                  </div>
                  {activity.description && <p className="text-sm text-muted-foreground">{activity.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
