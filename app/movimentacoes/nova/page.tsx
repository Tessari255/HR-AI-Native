import { NewMovimentacaoWizard } from "@/features/movimentacoes/components/new-movimentacao-wizard";

export default function NovaMovimentacaoPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova Movimentação</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os passos abaixo para solicitar uma movimentação de colaborador.
        </p>
      </div>

      <NewMovimentacaoWizard />
    </div>
  );
}
