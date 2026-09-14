"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyBRL } from "@/lib/utils";
import type { NovaMovimentacaoInput } from "../../schemas";
import type { Colaborador } from "../../types";
import { ColaboradorCombobox } from "./colaborador-combobox";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm font-medium text-destructive">{message}</p>;
}

function getMinDataVigencia(): string {
  const date = new Date();
  date.setDate(date.getDate() - 15);
  return date.toISOString().split("T")[0] ?? "";
}

export function StepDados() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<NovaMovimentacaoInput>();

  const tipo = watch("tipo");
  const parcelado = watch("parcelado");
  const novoGestorId = watch("novoGestorId") ?? "";
  const novoGestorNome = watch("novoGestorNome") ?? "";
  const novoSalario = watch("novoSalario");
  const salarioAtual = watch("salarioAtual");

  function handleGestorSelect(colaborador: Colaborador) {
    setValue("novoGestorId", colaborador.id, { shouldValidate: true, shouldDirty: true });
    setValue("novoGestorNome", colaborador.nome, { shouldValidate: true });
  }

  function handleSalarioChange(event: React.ChangeEvent<HTMLInputElement>) {
    const novo = event.target.value === "" ? undefined : Number(event.target.value);
    setValue("novoSalario", novo, { shouldValidate: true });
    if (novo !== undefined && salarioAtual) {
      const percentual = ((novo - salarioAtual) / salarioAtual) * 100;
      setValue("percentualReajuste", Number(percentual.toFixed(2)), { shouldValidate: true });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Dados da movimentação</h2>
        <p className="text-sm text-muted-foreground">
          Preencha as informações específicas da solicitação.
        </p>
      </div>

      {tipo === "MUDANCA_GESTOR" ? (
        <div className="space-y-2">
          <Label>Novo gestor</Label>
          <ColaboradorCombobox
            value={novoGestorId}
            displayValue={novoGestorNome}
            placeholder="Buscar novo gestor..."
            onSelect={handleGestorSelect}
          />
          <FieldError message={errors.novoGestorId?.message} />
        </div>
      ) : null}

      {tipo === "ALTERACAO_SALARIAL" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="novoCargo">Novo cargo</Label>
            <Input id="novoCargo" placeholder="Ex.: Analista de RH Sênior" {...register("novoCargo")} />
            <FieldError message={errors.novoCargo?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="novoSalario">Novo salário</Label>
            <Input
              id="novoSalario"
              type="number"
              min={0}
              step="0.01"
              value={novoSalario ?? ""}
              onChange={handleSalarioChange}
            />
            {salarioAtual !== undefined ? (
              <p className="text-xs text-muted-foreground">
                Salário atual: {formatCurrencyBRL(salarioAtual)}
              </p>
            ) : null}
            <FieldError message={errors.novoSalario?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentualReajuste">Percentual de reajuste (%)</Label>
            <Input
              id="percentualReajuste"
              type="number"
              step="0.01"
              {...register("percentualReajuste", { valueAsNumber: true })}
            />
            <FieldError message={errors.percentualReajuste?.message} />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="parcelado"
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              {...register("parcelado")}
            />
            <Label htmlFor="parcelado" className="font-normal">
              Reajuste parcelado
            </Label>
          </div>

          {parcelado ? (
            <div className="space-y-2">
              <Label htmlFor="numeroParcelas">Número de parcelas</Label>
              <Input
                id="numeroParcelas"
                type="number"
                min={2}
                max={12}
                {...register("numeroParcelas", { valueAsNumber: true })}
              />
              <FieldError message={errors.numeroParcelas?.message} />
            </div>
          ) : null}
        </div>
      ) : null}

      {tipo === "TRANSFERENCIA_CC" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="novoCentroCusto">Novo centro de custo</Label>
            <Input id="novoCentroCusto" placeholder="Ex.: CC-4521" {...register("novoCentroCusto")} />
            <FieldError message={errors.novoCentroCusto?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="novaPlanta">Nova planta</Label>
            <Input id="novaPlanta" placeholder="Ex.: Planta Jundiaí" {...register("novaPlanta")} />
            <FieldError message={errors.novaPlanta?.message} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dataVigencia">Data de vigência</Label>
          <Input id="dataVigencia" type="date" min={getMinDataVigencia()} {...register("dataVigencia")} />
          <p className="text-xs text-muted-foreground">Não pode ser retroativa em mais de 15 dias.</p>
          <FieldError message={errors.dataVigencia?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="justificativa">Justificativa</Label>
        <Textarea
          id="justificativa"
          rows={4}
          placeholder="Descreva o motivo da movimentação..."
          {...register("justificativa")}
        />
        <FieldError message={errors.justificativa?.message} />
      </div>
    </div>
  );
}
