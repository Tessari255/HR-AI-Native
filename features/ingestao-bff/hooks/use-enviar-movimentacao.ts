"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { enviarMovimentacao, MovimentacaoIngestaoError } from "../api";

/**
 * Hook reutilizável para envio de movimentações ao webhook n8n
 * ([A] Ingestão BFF). Centraliza feedback (toast) por status HTTP
 * (202/400/409/422/503); geração de correlationId/Idempotency-Key e
 * validação client-side ficam no service (api.ts).
 *
 * O chamador é responsável por limpar o formulário em caso de sucesso, ex.:
 *   mutate(values, { onSuccess: () => form.reset() })
 */
export function useEnviarMovimentacao() {
  return useMutation({
    mutationFn: enviarMovimentacao,
    onSuccess: (data) => {
      toast.success("Movimentação aceita para processamento", {
        description: `Protocolo: ${data.correlationId}`,
      });
    },
    onError: (error) => {
      if (!(error instanceof MovimentacaoIngestaoError)) {
        toast.error("Falha ao enviar movimentação", {
          description: "Erro inesperado. Tente novamente.",
        });
        return;
      }

      switch (error.code) {
        case "VALIDATION_ERROR":
          toast.error("Dados inválidos", { description: error.message });
          break;
        case "CONFLICT":
          toast.warning("Movimentação duplicada", { description: error.message });
          break;
        case "BUSINESS_RULE_VIOLATION":
          toast.error("Regra de negócio violada", { description: error.message });
          break;
        case "SERVICE_UNAVAILABLE":
          toast.warning("Serviço indisponível", {
            description: `${error.message} Tente novamente mais tarde.`,
          });
          break;
        case "CONFIG_MISSING":
        case "NETWORK_ERROR":
        case "UNKNOWN_ERROR":
        default:
          toast.error("Falha ao enviar movimentação", { description: error.message });
      }
    },
  });
}
