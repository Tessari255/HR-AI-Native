const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown>;
}

/**
 * Wrapper fino sobre fetch para o BFF (n8n webhook). Centraliza base URL,
 * serialização de JSON e normalização de erros em ApiError.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL não está configurada. Defina a variável de ambiente para apontar para o BFF (n8n).",
      500
    );
  }

  const { body, headers, ...rest } = options;
  const isFormData = body instanceof FormData;
  const isPlainObject = body !== undefined && !isFormData && typeof body === "object";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(isPlainObject ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: isPlainObject ? JSON.stringify(body) : (body as BodyInit | undefined),
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      // corpo sem JSON, ignora
    }
    const message =
      (details && typeof details === "object" && "message" in details
        ? String((details as { message: unknown }).message)
        : undefined) ?? `Falha na requisição (HTTP ${response.status})`;
    throw new ApiError(message, response.status, details);
  }

  if (response.status === 202 || response.status === 204) {
    if (response.status === 204) return undefined as T;
  }

  return (await response.json()) as T;
}
