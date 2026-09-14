"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useColaboradores } from "../../hooks/use-colaboradores";
import type { Colaborador } from "../../types";

interface ColaboradorComboboxProps {
  value: string;
  displayValue?: string;
  placeholder?: string;
  onSelect: (colaborador: Colaborador) => void;
}

export function ColaboradorCombobox({
  value,
  displayValue,
  placeholder = "Buscar colaborador...",
  onSelect,
}: ColaboradorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const { data: colaboradores, isFetching, isError } = useColaboradores(debouncedQuery);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">{value ? displayValue : placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Digite nome ou matrícula..." value={query} onValueChange={setQuery} />
          <CommandList>
            {isFetching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Buscando...
              </div>
            ) : isError ? (
              <div className="py-6 text-center text-sm text-destructive">Erro ao buscar colaboradores.</div>
            ) : debouncedQuery.trim().length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Digite ao menos 2 caracteres para buscar.
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                <CommandGroup>
                  {colaboradores?.map((colaborador) => (
                    <CommandItem
                      key={colaborador.id}
                      value={colaborador.id}
                      onSelect={() => {
                        onSelect(colaborador);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn("h-4 w-4", value === colaborador.id ? "opacity-100" : "opacity-0")}
                        aria-hidden
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{colaborador.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          Mat. {colaborador.matricula} · {colaborador.cargoAtual}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
