import type { z } from "zod";
import type {
  colaboradorSchema,
  novaMovimentacaoSchema,
  statusAprovacaoEnum,
  tipoMovimentacaoEnum,
} from "./schemas";

export type TipoMovimentacao = z.infer<typeof tipoMovimentacaoEnum>;
export type StatusAprovacao = z.infer<typeof statusAprovacaoEnum>;
export type Colaborador = z.infer<typeof colaboradorSchema>;
export type NovaMovimentacaoFormValues = z.infer<typeof novaMovimentacaoSchema>;

export interface MovimentacaoListItem {
  id: string;
  colaboradorNome: string;
  colaboradorMatricula: string;
  tipo: TipoMovimentacao;
  status: StatusAprovacao;
  dataSolicitacao: string;
  planta: string;
}

export interface MovimentacoesResponse {
  items: MovimentacaoListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MovimentacoesQueryParams {
  gestorId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: StatusAprovacao;
}

export const TIPO_MOVIMENTACAO_LABEL: Record<TipoMovimentacao, string> = {
  MUDANCA_GESTOR: "Mudança de Gestor",
  ALTERACAO_SALARIAL: "Alteração Salarial / Promoção",
  TRANSFERENCIA_CC: "Transferência de Centro de Custo",
};

export const STATUS_APROVACAO_LABEL: Record<StatusAprovacao, string> = {
  PENDENTE_GESTOR: "Pendente Gestor",
  PENDENTE_RH: "Pendente RH",
  PROCESSANDO: "Processando",
  CONCLUIDO: "Concluído",
  RECUSADO: "Recusado",
};
