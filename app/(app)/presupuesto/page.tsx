import { getActiveTrip } from "@/lib/trips";
import { getBudgetSummary, getPendingItems, getDailyBudget } from "@/lib/queries/budget";
import { getChecklistItems } from "@/lib/queries/checklist";
import { Checklist } from "@/components/budget/checklist";
import { DayBudgetChart } from "@/components/budget/day-budget-chart";
import { DayBudgetList } from "@/components/budget/day-budget-list";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";

export default async function PresupuestoPage() {
  const trip = await getActiveTrip();
  if (!trip) return <EmptyTripsState />;
  const currencyDisplay = { displayCurrency: trip.displayCurrency, eurToJpyRate: trip.eurToJpyRate };
  const [summary, pending, checklist, dailyBudget] = await Promise.all([
    getBudgetSummary(trip.id, currencyDisplay),
    getPendingItems(trip.id),
    getChecklistItems(trip.id),
    getDailyBudget(trip.id, currencyDisplay),
  ]);

  const stats =
    summary.registeredConverted != null && trip.displayCurrency
      ? [
          {
            label: "Total registrado",
            value: formatCurrency(summary.registeredConverted, trip.displayCurrency),
            className: "from-amber-200 to-orange-100",
          },
          {
            label: "Alojamientos",
            value: formatCurrency(summary.accommodationsConverted ?? 0, trip.displayCurrency),
            className: "from-sky-200 to-blue-100",
          },
          { label: "Pendientes", value: String(summary.pendingCount), className: "from-rose-200 to-pink-100" },
        ]
      : [
          { label: "Registrado (EUR)", value: `${summary.registeredEUR.toFixed(2)} €`, className: "from-amber-200 to-orange-100" },
          { label: "Registrado (JPY)", value: `¥${summary.registeredJPY.toFixed(0)}`, className: "from-sky-200 to-blue-100" },
          { label: "Pendientes", value: String(summary.pendingCount), className: "from-rose-200 to-pink-100" },
        ];

  return (
    <div className="space-y-10 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Presupuesto</h1>
        <p className="text-sm text-neutral-400">Resumen de gastos registrados y desglose por día del itinerario</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className={cn("rounded-2xl bg-linear-to-br p-5", stat.className)}>
            <p className="text-xs font-semibold text-neutral-600">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-neutral-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {dailyBudget.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">Gasto por día</h2>
          <DayBudgetChart days={dailyBudget} displayCurrency={trip.displayCurrency} />
          <DayBudgetList days={dailyBudget} displayCurrency={trip.displayCurrency} />
        </div>
      )}

      <div className="grid gap-10 sm:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">Elementos pendientes</h2>
          <ul className="space-y-2">
            {pending.map((item) => (
              <li key={item.id} className="rounded-xl border border-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700">
                {item.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">Checklist antes de salir</h2>
          <Checklist items={checklist} />
        </div>
      </div>
    </div>
  );
}
