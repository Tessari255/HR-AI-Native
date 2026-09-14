"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/http";
import { createMovimentacao } from "../api";

export function useCreateMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMovimentacao,
    onSuccess: (data) => {
      toast.success("Solicitação enviada com sucesso", {
        description: `Protocolo: ${data.correlationId}`,
      });
      void queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível enviar a solicitação. Tente novamente.";
      toast.error("Falha ao enviar solicitação", { description: message });
    },
  });
}
