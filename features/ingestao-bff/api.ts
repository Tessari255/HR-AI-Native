import { generateUuidV4 } from "@/lib/uuid";
import { movimentacaoPayloadSchema } from "./schemas";
import type {
  ErrorEnvelope,
  MovimentacaoIngestaoAccepted,
  MovimentacaoIngestaoErrorCode,
  MovimentacaoIngestaoInput,
} from "./types";

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

export class MovimentacaoIngestaoError extends Error {
  readonly status: number;
  readonly code: MovimentacaoIngestaoErrorCode;
  readonly correlationId?: string;
  readonly envelope?: ErrorEnvelope;

  constructor(params: {
    message: string;
    status: number;
    code: MovimentacaoIngestaoErrorCode;
    correlationId?: string;
    envelope?: ErrorEnvelope;
  }) {
    super(params.message);
    this.name = "MovimentacaoIngestaoError";
    this.status = params.status;
    this.code = params.code;
    this.correlationId = params.correlationId;
    this.envelope = params.envelope;
  }
}

const STATUS_ERROR_MAP: Record<
  number,
  { code: MovimentacaoIngestaoErrorCode; fallbackMessage: string }
> = {
  400: {
    code: "VALIDATION_ERROR",
    fallbackMessage: "Payload fora do schema esperado ou header Idempotency-Key ausente.",
  },
  409: {
    code: "CONFLICT",
    fallbackMessage: "Conflito: já existe uma movimentação divergente para esta mesma solicitação.",
  },
  422: {
    code: "BUSINESS_RULE_VIOLATION",
    fallbackMessage: "A movimentação viola regras de negócio internas.",
  },
  503: {
    code: "SERVICE_UNAVAILABLE",
    fallbackMessage: "O ServiceNow está indisponível no momento. Tente novamente mais tarde.",
  },
};

function getWebhookUrl(): string {
  if (!N8N_WEBHOOK_URL) {
    throw new MovimentacaoIngestaoError({
      message:
        "NEXT_PUBLIC_N8N_WEBHOOK_URL não está configurada. Defina a variável de ambiente apontando para o webhook do n8n ([A] Ingestão BFF).",
      status: 500,
      code: "CONFIG_MISSING",
    });
  }
  return N8N_WEBHOOK_URL;
}

async function parseErrorEnvelope(response: Response): Promise<ErrorEnvelope | undefined> {
  try {
    const body: unknown = await response.json();
    if (
      body !== null &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "object"
    ) {
      return body as ErrorEnvelope;
    }
  } catch {
    // corpo ausente ou não-JSON — segue com a mensagem padrão do status
  }
  return undefined;
}

/**
 * Envia uma movimentação ao webhook n8n ([A] Ingestão BFF). Gera um
 * correlationId e uma Idempotency-Key novos a cada chamada (uma tentativa de
 * submissão = uma chave), valida o payload contra o schema estrito antes de
 * enviar, e normaliza toda resposta não-202 em MovimentacaoIngestaoError.
 */
export async function enviarMovimentacao(
  input: MovimentacaoIngestaoInput
): Promise<MovimentacaoIngestaoAccepted> {
  const webhookUrl = getWebhookUrl();

  const correlationId = generateUuidV4();
  const idempotencyKey = generateUuidV4();

  const parsed = movimentacaoPayloadSchema.safeParse({ ...input, correlationId });
  if (!parsed.success) {
    throw new MovimentacaoIngestaoError({
      message: parsed.error.issues.map((issue) => issue.message).join(" "),
      status: 400,
      code: "VALIDATION_ERROR",
      correlationId,
    });
  }

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    throw new MovimentacaoIngestaoError({
      message:
        "Não foi possível conectar ao serviço de movimentações. Verifique sua conexão e tente novamente.",
      status: 0,
      code: "NETWORK_ERROR",
      correlationId,
    });
  }

  if (response.status === 202) {
    return { correlationId, status: "ACCEPTED" };
  }

  const envelope = await parseErrorEnvelope(response);
  const mapped = STATUS_ERROR_MAP[response.status];

  throw new MovimentacaoIngestaoError({
    message:
      envelope?.error.message ??
      mapped?.fallbackMessage ??
      `Falha inesperada ao enviar a movimentação (HTTP ${response.status}).`,
    status: response.status,
    code: mapped?.code ?? "UNKNOWN_ERROR",
    correlationId: envelope?.correlationId ?? correlationId,
    envelope,
  });
}
