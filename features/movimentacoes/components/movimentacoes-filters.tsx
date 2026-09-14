"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_APROVACAO_LABEL } from "../types";
import type { StatusAprovacao } from "../types";

interface MovimentacoesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusAprovacao | "TODOS";
  onStatusChange: (value: StatusAprovacao | "TODOS") => void;
}

export function MovimentacoesFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: MovimentacoesFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por colaborador, matrícula ou ID..."
          className="pl-9"
          aria-label="Buscar movimentações"
        />
      </div>
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as StatusAprovacao | "TODOS")}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos os status</SelectItem>
          {Object.entries(STATUS_APROVACAO_LABEL).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
