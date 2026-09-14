"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { useEnviarMovimentacao } from "@/features/ingestao-bff/hooks/use-enviar-movimentacao";
import { useCurrentGestor } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildIngestaoInputs } from "../ingestao-mapper";
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
  empresa: "",
  plantaAtual: "",
  cargoAtual: "",
  centroCustoAtual: "",
  gestorAtualId: "",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const enviarMovimentacao = useEnviarMovimentacao();
  const { email: solicitanteEmail } = useCurrentGestor();

  const form = useForm<NovaMovimentacaoInput>({
    resolver: zodResolver(novaMovimentacaoSchema),
    defaultValues,
    mode: "onBlur",
  });

  const tipo = form.watch("tipo");
  const stepFields = getStepFields(tipo);
  const StepComponent = STEP_COMPONENTS[step] ?? StepTipo;
  const isLastStep = step === TOTAL_STEPS - 1;
  const isBusy = isSubmitting || enviarMovimentacao.isPending;

  async function handleNext() {
    const fields = stepFields[step] ?? [];
    const valid = await form.trigger(fields);
    if (!valid) return;
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  // Cada atributo alterado vira uma chamada própria a enviarMovimentacao()
  // (correlationId/Idempotency-Key próprios), pois o contrato do webhook
  // n8n aceita uma mudança de atributo por requisição. Envia em sequência e
  // para no primeiro erro — o hook já notifica a falha via toast.
  async function onValid(values: NovaMovimentacaoInput) {
    const parsed = novaMovimentacaoSchema.parse(values);
    const inputs = buildIngestaoInputs(parsed, solicitanteEmail);

    setIsSubmitting(true);
    try {
      for (const input of inputs) {
        await enviarMovimentacao.mutateAsync(input);
      }
    } catch {
      return;
    } finally {
      setIsSubmitting(false);
    }

    form.reset(defaultValues);
    setStep(0);
    router.push("/");
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
              disabled={isBusy}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {step === 0 ? "Cancelar" : "Voltar"}
            </Button>

            {isLastStep ? (
              <Button type="submit" disabled={isBusy}>
                {isBusy ? (
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
