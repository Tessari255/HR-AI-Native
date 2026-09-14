import { apiFetch } from "@/lib/api/http";
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

export async function fetchColaboradores(search: string): Promise<Colaborador[]> {
  const query = new URLSearchParams({ search });
  return apiFetch<Colaborador[]>(`/api/v1/colaboradores?${query.toString()}`, {
    method: "GET",
  });
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
