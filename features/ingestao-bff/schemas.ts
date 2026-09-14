import { z } from "zod";

export const tipoMovimentacaoIngestaoEnum = z.enum([
  "DIVERGENTE",
  "PROMOCAO",
  "TRANSFERENCIA",
  "AJUSTE",
]);

const dataReferenciaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de referência deve estar no formato YYYY-MM-DD")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
    message: "Data de referência inválida",
  });

/**
 * Schema estrito do payload aceito pelo webhook n8n ([A] Ingestão BFF).
 * Validado no client antes do envio, como guarda adicional ao 400 do backend.
 */
export const movimentacaoPayloadSchema = z.object({
  correlationId: z.string().uuid("correlationId deve ser um UUID v4 válido"),
  matricula: z.string().min(1, "Informe a matrícula"),
  empresa: z.string().min(1, "Informe a empresa"),
  tipo: tipoMovimentacaoIngestaoEnum,
  atributo: z.string().min(1, "Informe o atributo alterado"),
  valorAnterior: z.string().min(1, "Informe o valor anterior"),
  valorNovo: z.string().min(1, "Informe o valor novo"),
  dataReferencia: dataReferenciaSchema,
  solicitanteEmail: z.string().email("Informe um e-mail válido"),
});
