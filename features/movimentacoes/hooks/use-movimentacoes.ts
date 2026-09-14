"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchMovimentacoes } from "../api";
import type { MovimentacoesQueryParams } from "../types";

export function useMovimentacoes(params: MovimentacoesQueryParams) {
  return useQuery({
    queryKey: ["movimentacoes", params],
    queryFn: () => fetchMovimentacoes(params),
    placeholderData: keepPreviousData,
    enabled: Boolean(params.gestorId),
  });
}
