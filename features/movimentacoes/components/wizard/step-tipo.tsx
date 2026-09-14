"use client";

import { useFormContext } from "react-hook-form";
import { ArrowLeftRight, Banknote, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NovaMovimentacaoInput } from "../../schemas";
import { TIPO_MOVIMENTACAO_LABEL } from "../../types";
import type { TipoMovimentacao } from "../../types";

const TIPO_OPTIONS: {
  value: TipoMovimentacao;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "MUDANCA_GESTOR",
    description: "Reatribuir o colaborador a um novo gestor direto.",
    icon: UserCog,
  },
  {
    value: "ALTERACAO_SALARIAL",
    description: "Promoção, mudança de cargo e/ou reajuste salarial.",
    icon: Banknote,
  },
  {
    value: "TRANSFERENCIA_CC",
    description: "Transferir o colaborador para outro centro de custo e/ou planta.",
    icon: ArrowLeftRight,
  },
];

export function StepTipo() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<NovaMovimentacaoInput>();
  const tipoSelecionado = watch("tipo");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Qual o tipo de movimentação?</h2>
        <p className="text-sm text-muted-foreground">
          Selecione a categoria que melhor descreve a solicitação.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tipo de movimentação">
        {TIPO_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = tipoSelecionado === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() =>
                setValue("tipo", option.value, { shouldValidate: true, shouldDirty: true })
              }
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent",
                isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
              )}
            >
              <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} aria-hidden />
              <span className="font-medium">{TIPO_MOVIMENTACAO_LABEL[option.value]}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </button>
          );
        })}
      </div>

      {errors.tipo ? <p className="text-sm font-medium text-destructive">{errors.tipo.message}</p> : null}
    </div>
  );
}
