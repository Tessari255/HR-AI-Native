"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCreateMovimentacao } from "../hooks/use-create-movimentacao";
import { getStepFields, novaMovimentacaoSchema } from "../schemas";
import type { NovaMovimentacaoInput } from "../schemas";
import { StepColaborador } from "./wizard/step-colaborador";
import { StepDados } from "./wizard/step-dados";
import { StepEvidencias } from "./wizard/step-evidencias";
import { StepIndicator } from "./wizard/step-indicator";
import { StepTipo } from "./wizard/step-tipo";

const STEP_COMPONENTS = [StepTipo, StepColaborador, StepDados, StepEvidencias];
const TOTAL_STEPS = STEP_COMPONENTS.length;

const defaultValues = {
  tipo: undefined,
  colaboradorId: "",
  colaboradorNome: "",
  colaboradorMatricula: "",
  plantaAtual: "",
  cargoAtual: "",
  centroCustoAtual: "",
  salarioAtual: undefined,
  novoGestorId: "",
  novoGestorNome: "",
  novoCargo: "",
  novoSalario: undefined,
  percentualReajuste: undefined,
  parcelado: false,
  numeroParcelas: undefined,
  novoCentroCusto: "",
  novaPlanta: "",
  dataVigencia: "",
  justificativa: "",
  offerLetter: [],
  creqEreq: [],
  justificativaAnexo: [],
} as unknown as NovaMovimentacaoInput;

export function NewMovimentacaoWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const createMovimentacao = useCreateMovimentacao();

  const form = useForm<NovaMovimentacaoInput>({
    resolver: zodResolver(novaMovimentacaoSchema),
    defaultValues,
    mode: "onBlur",
  });

  const tipo = form.watch("tipo");
  const stepFields = getStepFields(tipo);
  const StepComponent = STEP_COMPONENTS[step] ?? StepTipo;
  const isLastStep = step === TOTAL_STEPS - 1;

  async function handleNext() {
    const fields = stepFields[step] ?? [];
    const valid = await form.trigger(fields);
    if (!valid) return;
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function onValid(values: NovaMovimentacaoInput) {
    const parsed = novaMovimentacaoSchema.parse(values);
    createMovimentacao.mutate(parsed, {
      onSuccess: () => {
        form.reset(defaultValues);
        setStep(0);
        router.push("/");
      },
    });
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onValid)} noValidate>
        <Card>
          <CardHeader className="space-y-4">
            <Progress value={((step + 1) / TOTAL_STEPS) * 100} />
            <StepIndicator currentStep={step} />
          </CardHeader>
          <CardContent className="min-h-[360px]">
            <StepComponent />
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={step === 0 ? () => router.push("/") : handleBack}
              disabled={createMovimentacao.isPending}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {step === 0 ? "Cancelar" : "Voltar"}
            </Button>

            {isLastStep ? (
              <Button type="submit" disabled={createMovimentacao.isPending}>
                {createMovimentacao.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-4 w-4" aria-hidden />
                )}
                Enviar Solicitação
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Continuar
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
