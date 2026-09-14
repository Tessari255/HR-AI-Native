"use client";

import { useFormContext } from "react-hook-form";
import { User } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { NovaMovimentacaoInput } from "../../schemas";
import type { Colaborador } from "../../types";
import { ColaboradorCombobox } from "./colaborador-combobox";

export function StepColaborador() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<NovaMovimentacaoInput>();

  const colaboradorId = watch("colaboradorId");
  const colaboradorNome = watch("colaboradorNome");
  const colaboradorMatricula = watch("colaboradorMatricula");
  const plantaAtual = watch("plantaAtual");
  const cargoAtual = watch("cargoAtual");
  const centroCustoAtual = watch("centroCustoAtual");
  const salarioAtual = watch("salarioAtual");

  function handleSelect(colaborador: Colaborador) {
    setValue("colaboradorId", colaborador.id, { shouldValidate: true, shouldDirty: true });
    setValue("colaboradorNome", colaborador.nome, { shouldValidate: true });
    setValue("colaboradorMatricula", colaborador.matricula, { shouldValidate: true });
    setValue("plantaAtual", colaborador.planta, { shouldValidate: true });
    setValue("cargoAtual", colaborador.cargoAtual);
    setValue("centroCustoAtual", colaborador.centroCustoAtual);
    setValue("salarioAtual", colaborador.salarioAtual);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Selecione o colaborador</h2>
        <p className="text-sm text-muted-foreground">
          Busque por nome ou matrícula entre os colaboradores da sua alçada.
        </p>
      </div>

      <ColaboradorCombobox
        value={colaboradorId}
        displayValue={`${colaboradorNome} (Mat. ${colaboradorMatricula})`}
        onSelect={handleSelect}
      />

      {errors.colaboradorId ? (
        <p className="text-sm font-medium text-destructive">{errors.colaboradorId.message}</p>
      ) : null}

      {colaboradorId ? (
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Cargo atual</dt>
                <dd className="font-medium">{cargoAtual}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Centro de custo</dt>
                <dd className="font-medium">{centroCustoAtual}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Planta</dt>
                <dd className="font-medium">{plantaAtual}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Salário atual</dt>
                <dd className="font-medium">
                  {salarioAtual !== undefined ? formatCurrencyBRL(salarioAtual) : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
