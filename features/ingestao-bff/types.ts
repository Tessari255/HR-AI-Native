import type { z } from "zod";
import type { movimentacaoPayloadSchema, tipoMovimentacaoIngestaoEnum } from "./schemas";

export type TipoMovimentacaoIngestao = z.infer<typeof tipoMovimentacaoIngestaoEnum>;

export type MovimentacaoPayload = z.infer<typeof movimentacaoPayloadSchema>;

/** Campos preenchidos pelo chamador; correlationId é gerado internamente a cada tentativa de envio. */
export type MovimentacaoIngestaoInput = Omit<MovimentacaoPayload, "correlationId">;

export interface MovimentacaoIngestaoAccepted {
  correlationId: string;
  status: "ACCEPTED";
}

export interface ErrorEnvelope {
  correlationId: string;
  status: number;
  error: {
    code: string;
    message: string;
  };
}

export type MovimentacaoIngestaoErrorCode =
  | "CONFIG_MISSING"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "BUSINESS_RULE_VIOLATION"
  | "SERVICE_UNAVAILABLE"
  | "UNKNOWN_ERROR";

export const TIPO_MOVIMENTACAO_INGESTAO_LABEL: Record<TipoMovimentacaoIngestao, string> = {
  DIVERGENTE: "Divergência",
  PROMOCAO: "Promoção",
  TRANSFERENCIA: "Transferência",
  AJUSTE: "Ajuste",
};
