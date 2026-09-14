"use client";

import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebouncedCallback } from "use-debounce";
import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCurrentGestor } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { useMovimentacoes } from "../hooks/use-movimentacoes";
import { TIPO_MOVIMENTACAO_LABEL } from "../types";
import type { StatusAprovacao } from "../types";
import { MovimentacoesFilters } from "./movimentacoes-filters";
import { MovimentacoesTableSkeleton } from "./movimentacoes-table-skeleton";
import { StatusBadge } from "./status-badge";

const PAGE_SIZE = 50;
const ROW_HEIGHT = 60;
const GRID_COLUMNS =
  "minmax(96px,120px) minmax(180px,1.5fr) minmax(180px,1fr) minmax(150px,170px) minmax(130px,150px) minmax(100px,120px)";
const COLUMN_LABELS = ["ID", "Colaborador", "Tipo", "Status", "Data da Solicitação", "Planta"];

export function MovimentacoesTable() {
  const { gestorId } = useCurrentGestor();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusAprovacao | "TODOS">("TODOS");
  const parentRef = useRef<HTMLDivElement>(null);

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    debouncedSetSearch(value);
  }

  function handleStatusChange(value: StatusAprovacao | "TODOS") {
    setStatus(value);
    setPage(1);
  }

  const { data, isLoading, isError, error, isFetching, refetch } = useMovimentacoes({
    gestorId,
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status === "TODOS" ? undefined : status,
  });

  const rows = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  return (
    <Card className="p-4">
      <div className="mb-4">
        <MovimentacoesFilters
          search={searchInput}
          onSearchChange={handleSearchChange}
          status={status}
          onStatusChange={handleStatusChange}
        />
      </div>

      {isLoading ? (
        <MovimentacoesTableSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Erro ao carregar movimentações."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Nenhuma movimentação encontrada.</p>
        </div>
      ) : (
        <div role="table" aria-label="Movimentações" className="overflow-hidden rounded-md border">
          <div
            role="row"
            className="grid border-b bg-muted/50 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: GRID_COLUMNS }}
          >
            {COLUMN_LABELS.map((label) => (
              <div key={label} role="columnheader" className="px-4 py-3">
                {label}
              </div>
            ))}
          </div>

          <div
            ref={parentRef}
            className="max-h-[560px] overflow-auto transition-opacity"
            style={{ opacity: isFetching ? 0.6 : 1 }}
          >
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const item = rows[virtualRow.index];
                if (!item) return null;
                return (
                  <div
                    key={item.id}
                    role="row"
                    className="grid items-center border-b text-sm transition-colors hover:bg-muted/50"
                    style={{
                      gridTemplateColumns: GRID_COLUMNS,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div role="cell" className="truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                      {item.id}
                    </div>
                    <div role="cell" className="px-4 py-3">
                      <div className="font-medium">{item.colaboradorNome}</div>
                      <div className="text-xs text-muted-foreground">Mat. {item.colaboradorMatricula}</div>
                    </div>
                    <div role="cell" className="px-4 py-3">
                      {TIPO_MOVIMENTACAO_LABEL[item.tipo]}
                    </div>
                    <div role="cell" className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </div>
                    <div role="cell" className="px-4 py-3 text-muted-foreground">
                      {formatDate(item.dataSolicitacao)}
                    </div>
                    <div role="cell" className="truncate px-4 py-3">
                      {item.planta}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {data && rows.length > 0 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.total} movimentação(ões) — página {data.page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
