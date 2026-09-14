import { apiFetch, ApiError } from "@/lib/api/http";
import type {
  Colaborador,
  CreateMovimentacaoResponse,
  MovimentacoesQueryParams,
  MovimentacoesResponse,
  NovaMovimentacaoFormValues,
} from "./types";

export async function fetchMovimentacoes(
  params: MovimentacoesQueryParams
): Promise<MovimentacoesResponse> {
  const query = new URLSearchParams();
  query.set("gestorId", params.gestorId);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);

  return apiFetch<MovimentacoesResponse>(`/api/v1/movimentacoes?${query.toString()}`, {
    method: "GET",
  });
}

/**
 * Busca colaboradores via proxy server-side local (app/api/colaboradores),
 * que por sua vez consulta o ServiceNow (ou o mock, conforme env vars) sem
 * expor credenciais ao client. Não usa apiFetch: essa rota é própria do
 * Next.js, não do BFF externo (NEXT_PUBLIC_API_URL).
 */
export async function fetchColaboradores(search: string): Promise<Colaborador[]> {
  const query = new URLSearchParams({ q: search });
  const response = await fetch(`/api/colaboradores?${query.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let message = `Falha ao buscar colaboradores (HTTP ${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // corpo sem JSON, ignora
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as Colaborador[];
}

/**
 * Monta multipart/form-data: campo "payload" com o JSON estruturado e os
 * anexos em campos próprios, conforme esperado pelo workflow n8n.
 */
function buildMovimentacaoFormData(values: NovaMovimentacaoFormValues): FormData {
  const { offerLetter, creqEreq, justificativaAnexo, ...rest } = values;

  const formData = new FormData();
  formData.append("payload", JSON.stringify(rest));

  offerLetter.forEach((file) => formData.append("offerLetter", file, file.name));
  creqEreq.forEach((file) => formData.append("creqEreq", file, file.name));
  justificativaAnexo.forEach((file) => formData.append("justificativaAnexo", file, file.name));

  return formData;
}

export async function createMovimentacao(
  values: NovaMovimentacaoFormValues
): Promise<CreateMovimentacaoResponse> {
  return apiFetch<CreateMovimentacaoResponse>("/api/v1/movimentacoes", {
    method: "POST",
    body: buildMovimentacaoFormData(values),
  });
}
