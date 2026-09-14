import type { MovimentacaoIngestaoInput } from "@/features/ingestao-bff/types";
import type { NovaMovimentacaoFormValues, TipoMovimentacao } from "./types";

/**
 * O webhook n8n ([A] Ingestão BFF) aceita uma mudança de atributo por
 * chamada (matricula + atributo + valorAnterior + valorNovo), enquanto o
 * wizard pode alterar mais de um atributo por solicitação (ex.: cargo +
 * salário em ALTERACAO_SALARIAL). Por isso cada tipo do wizard produz uma
 * ou mais entradas, enviadas em sequência por enviarMovimentacao().
 *
 * Mapeamento de "tipo" (decisão de produto, sem correspondência 1:1):
 * - ALTERACAO_SALARIAL → PROMOCAO (cargo e/ou salário)
 * - TRANSFERENCIA_CC   → TRANSFERENCIA (centro de custo e planta)
 * - MUDANCA_GESTOR     → AJUSTE (sem categoria própria no contrato atual)
 */
const TIPO_WIZARD_TO_INGESTAO: Record<TipoMovimentacao, MovimentacaoIngestaoInput["tipo"]> = {
  MUDANCA_GESTOR: "AJUSTE",
  ALTERACAO_SALARIAL: "PROMOCAO",
  TRANSFERENCIA_CC: "TRANSFERENCIA",
};

const FALLBACK_EMPRESA = "1";
const VALOR_INDISPONIVEL = "—";

export function buildIngestaoInputs(
  values: NovaMovimentacaoFormValues,
  solicitanteEmail: string
): MovimentacaoIngestaoInput[] {
  const base = {
    matricula: values.colaboradorMatricula,
    empresa: values.empresa || FALLBACK_EMPRESA,
    tipo: TIPO_WIZARD_TO_INGESTAO[values.tipo],
    dataReferencia: values.dataVigencia,
    solicitanteEmail,
  };

  switch (values.tipo) {
    case "MUDANCA_GESTOR":
      return [
        {
          ...base,
          atributo: "gestor",
          valorAnterior: values.gestorAtualId || VALOR_INDISPONIVEL,
          valorNovo: values.novoGestorId ?? "",
        },
      ];

    case "ALTERACAO_SALARIAL":
      return [
        {
          ...base,
          atributo: "cargo",
          valorAnterior: values.cargoAtual || VALOR_INDISPONIVEL,
          valorNovo: values.novoCargo ?? "",
        },
        {
          ...base,
          atributo: "salario",
          valorAnterior: values.salarioAtual !== undefined ? String(values.salarioAtual) : VALOR_INDISPONIVEL,
          valorNovo: values.novoSalario !== undefined ? String(values.novoSalario) : "",
        },
      ];

    case "TRANSFERENCIA_CC":
      return [
        {
          ...base,
          atributo: "centro_custo",
          valorAnterior: values.centroCustoAtual || VALOR_INDISPONIVEL,
          valorNovo: values.novoCentroCusto ?? "",
        },
        {
          ...base,
          atributo: "planta",
          valorAnterior: values.plantaAtual || VALOR_INDISPONIVEL,
          valorNovo: values.novaPlanta ?? "",
        },
      ];

    default:
      return [];
  }
}
