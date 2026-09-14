import { ApiError } from "@/lib/api/http";
import type { Colaborador, MovimentacoesQueryParams, MovimentacoesResponse } from "./types";

/**
 * Busca movimentações via proxy server-side local (app/api/movimentacoes).
 * Hoje retorna uma lista vazia (stub) até existir um backend real por trás
 * do webhook n8n para esta consulta.
 */
export async function fetchMovimentacoes(
  params: MovimentacoesQueryParams
): Promise<MovimentacoesResponse> {
  const query = new URLSearchParams();
  query.set("gestorId", params.gestorId);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);

  const response = await fetch(`/api/movimentacoes?${query.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let message = `Falha ao buscar movimentações (HTTP ${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // corpo sem JSON, ignora
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as MovimentacoesResponse;
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
