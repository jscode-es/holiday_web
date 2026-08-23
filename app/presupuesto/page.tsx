import { getBudgetSummary, getPendingItems } from "@/lib/queries/budget";
import { getChecklistItems } from "@/lib/queries/checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checklist } from "@/components/budget/checklist";

export default async function PresupuestoPage() {
  const [summary, pending, checklist] = await Promise.all([
    getBudgetSummary(),
    getPendingItems(),
    getChecklistItems(),
  ]);

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Presupuesto</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Registrado (EUR)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.registeredEUR.toFixed(2)} €</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Registrado (JPY)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">¥{summary.registeredJPY.toFixed(0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.pendingCount}</CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Elementos pendientes</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {pending.map((item) => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Checklist antes de salir</h2>
        <Checklist items={checklist} />
      </div>
    </div>
  );
}
