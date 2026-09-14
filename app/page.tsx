import { Suspense } from "react";
import { MovimentacoesTable } from "@/features/movimentacoes/components/movimentacoes-table";
import { MovimentacoesTableSkeleton } from "@/features/movimentacoes/components/movimentacoes-table-skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Movimentações</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe as solicitações de movimentação da sua alçada.
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="p-4">
            <MovimentacoesTableSkeleton />
          </Card>
        }
      >
        <MovimentacoesTable />
      </Suspense>
    </div>
  );
}
