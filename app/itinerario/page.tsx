import { getAllDaysWithActivities } from "@/lib/queries/days";
import { cn } from "@/lib/utils";

const typeStyle: Record<string, { label: string; className: string }> = {
  transport: { label: "Transporte", className: "bg-sky-50 text-sky-700" },
  place: { label: "Lugar", className: "bg-emerald-50 text-emerald-700" },
  event: { label: "Evento", className: "bg-violet-50 text-violet-700" },
  comida: { label: "Comida", className: "bg-amber-50 text-amber-700" },
  nota: { label: "Nota", className: "bg-neutral-100 text-neutral-600" },
  aviso: { label: "Aviso", className: "bg-rose-50 text-rose-700" },
  hotel: { label: "Hotel", className: "bg-neutral-900 text-white" },
};

const statusStyle: Record<string, string> = {
  pendiente: "bg-rose-100 text-rose-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  programado: "bg-neutral-100 text-neutral-600",
};

export default async function ItinerarioPage() {
  const days = await getAllDaysWithActivities();

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Itinerario</h1>
        <p className="text-sm text-neutral-400">Vista completa día a día, en orden cronológico</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-12">
        {days.map((day) => (
          <section key={day.id} className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                {day.dayNumber}
              </span>
              <div>
                <h2 className="text-base font-semibold text-neutral-900">{day.title}</h2>
                <p className="text-xs text-neutral-400">{day.date}</p>
              </div>
            </div>
            {day.summary && <p className="pl-11 text-sm text-neutral-500">{day.summary}</p>}

            <div className="space-y-4 border-l border-neutral-100 pl-11">
              {day.activities.map((activity) => {
                const type = typeStyle[activity.type];
                return (
                  <div key={activity.id} className="flex gap-3">
                    <span className="w-11 shrink-0 font-mono text-xs text-neutral-400">{activity.time ?? "—"}</span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", type.className)}>
                          {type.label}
                        </span>
                        {activity.status && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              statusStyle[activity.status]
                            )}
                          >
                            {activity.status}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-neutral-900">{activity.title}</span>
                      </div>
                      {activity.description && <p className="text-sm text-neutral-500">{activity.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
