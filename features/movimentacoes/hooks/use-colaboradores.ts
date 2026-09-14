"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchColaboradores } from "../api";

const MIN_SEARCH_LENGTH = 2;

export function useColaboradores(search: string) {
  const normalized = search.trim();

  return useQuery({
    queryKey: ["colaboradores", normalized],
    queryFn: () => fetchColaboradores(normalized),
    enabled: normalized.length >= MIN_SEARCH_LENGTH,
    staleTime: 30_000,
  });
}
