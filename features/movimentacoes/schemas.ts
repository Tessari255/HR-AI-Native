import { z } from "zod";

export const tipoMovimentacaoEnum = z.enum([
  "MUDANCA_GESTOR",
  "ALTERACAO_SALARIAL",
  "TRANSFERENCIA_CC",
]);

export const statusAprovacaoEnum = z.enum([
  "PENDENTE_GESTOR",
  "PENDENTE_RH",
  "PROCESSANDO",
  "CONCLUIDO",
  "RECUSADO",
]);

export const colaboradorSchema = z.object({
  id: z.string(),
  nome: z.string(),
  matricula: z.string(),
  empresa: z.string(),
  cargoAtual: z.string(),
  centroCustoAtual: z.string(),
  planta: z.string(),
  gestorId: z.string(),
  salarioAtual: z.number().nonnegative(),
});

// ---------------------------------------------------------------------------
// Anexos (Passo 4)
// ---------------------------------------------------------------------------

const ACCEPTED_FILE_TYPES = ["application/pdf", "image/png"] as const;
const MAX_FILE_SIZE_MB = 5;

export const anexoSchema = z
  .instanceof(File, { message: "Selecione um arquivo válido" })
  .refine((file) => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024, {
    message: `O arquivo deve ter no máximo ${MAX_FILE_SIZE_MB}MB`,
  })
  .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number]), {
    message: "Apenas arquivos PDF ou PNG são aceitos",
  });

export const ACCEPTED_FILE_EXTENSIONS = ".pdf,.png";

// ---------------------------------------------------------------------------
// Data de vigência: não pode ser mais de 15 dias retroativa
// ---------------------------------------------------------------------------

export const dataVigenciaSchema = z
  .string()
  .min(1, "Informe a data de vigência")
  .refine(
    (value) => {
      const data = new Date(`${value}T00:00:00`);
      return !Number.isNaN(data.getTime());
    },
    { message: "Data inválida" }
  )
  .refine(
    (value) => {
      const data = new Date(`${value}T00:00:00`);
      const limite = new Date();
      limite.setHours(0, 0, 0, 0);
      limite.setDate(limite.getDate() - 15);
      return data >= limite;
    },
    { message: "A data de vigência não pode ser retroativa em mais de 15 dias" }
  );

// ---------------------------------------------------------------------------
// Schema único do formulário (multi-step). Os campos condicionais por tipo
// são validados via superRefine, permitindo reaproveitar um único
// react-hook-form ao longo dos 4 passos do wizard.
// ---------------------------------------------------------------------------

export const novaMovimentacaoSchema = z
  .object({
    // Passo 1 — Tipo
    tipo: tipoMovimentacaoEnum,

    // Passo 2 — Colaborador
    colaboradorId: z.string().min(1, "Selecione um colaborador"),
    colaboradorNome: z.string().min(1),
    colaboradorMatricula: z.string().min(1),
    empresa: z.string().optional(),
    plantaAtual: z.string().min(1),
    cargoAtual: z.string().optional(),
    centroCustoAtual: z.string().optional(),
    gestorAtualId: z.string().optional(),
    salarioAtual: z.number().optional(),

    // Passo 3 — Dados da movimentação (campos por tipo)
    // Mudança de gestor
    novoGestorId: z.string().optional(),
    novoGestorNome: z.string().optional(),

    // Alteração salarial / promoção
    novoCargo: z.string().optional(),
    novoSalario: z.coerce.number().optional(),
    percentualReajuste: z.coerce.number().optional(),
    parcelado: z.boolean().default(false),
    numeroParcelas: z.coerce.number().int().optional(),

    // Transferência de centro de custo
    novoCentroCusto: z.string().optional(),
    novaPlanta: z.string().optional(),

    // Comuns
    dataVigencia: dataVigenciaSchema,
    justificativa: z.string().min(10, "Descreva a justificativa (mínimo 10 caracteres)"),

    // Passo 4 — Evidências
    offerLetter: z.array(anexoSchema).default([]),
    creqEreq: z.array(anexoSchema).default([]),
    justificativaAnexo: z.array(anexoSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "MUDANCA_GESTOR") {
      if (!data.novoGestorId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["novoGestorId"],
          message: "Selecione o novo gestor",
        });
      }
    }

    if (data.tipo === "ALTERACAO_SALARIAL") {
      if (!data.novoCargo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["novoCargo"],
          message: "Informe o novo cargo",
        });
      }

      if (data.novoSalario === undefined || Number.isNaN(data.novoSalario)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["novoSalario"],
          message: "Informe o novo salário",
        });
      } else if (data.novoSalario <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["novoSalario"],
          message: "O novo salário deve ser maior que zero",
        });
      } else if (data.salarioAtual !== undefined && data.novoSalario <= data.salarioAtual) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["novoSalario"],
          message: "O novo salário deve ser maior que o salário atual",
        });
      }

      if (data.percentualReajuste === undefined || Number.isNaN(data.percentualReajuste)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["percentualReajuste"],
          message: "Informe o percentual de reajuste",
        });
      } else if (data.percentualReajuste <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["percentualReajuste"],
          message: "O percentual salarial não pode ser negativo ou zero",
        });
      }

      if (data.parcelado) {
        if (!data.numeroParcelas || data.numeroParcelas < 2 || data.numeroParcelas > 12) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["numeroParcelas"],
            message: "Informe o número de parcelas (entre 2 e 12)",
          });
        }
      }

      if (data.offerLetter.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["offerLetter"],
          message: "Anexe a offer letter / comprovante de aprovação (PDF ou PNG)",
        });
      }
    }

    if (data.tipo === "TRANSFERENCIA_CC") {
      if (!data.novoCentroCusto) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["novoCentroCusto"],
          message: "Informe o novo centro de custo",
        });
      }
      if (!data.novaPlanta) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["novaPlanta"],
          message: "Informe a nova planta",
        });
      }
      if (data.creqEreq.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["creqEreq"],
          message: "Anexe o C-req/E-req (PDF ou PNG)",
        });
      }
    }
  });

export type NovaMovimentacaoInput = z.input<typeof novaMovimentacaoSchema>;

// Campos validados em cada passo do wizard, usados com form.trigger(...)
export function getStepFields(
  tipo: z.infer<typeof tipoMovimentacaoEnum> | undefined
): (keyof NovaMovimentacaoInput)[][] {
  const dadosPorTipo: Record<string, (keyof NovaMovimentacaoInput)[]> = {
    MUDANCA_GESTOR: ["novoGestorId", "dataVigencia", "justificativa"],
    ALTERACAO_SALARIAL: [
      "novoCargo",
      "novoSalario",
      "percentualReajuste",
      "numeroParcelas",
      "dataVigencia",
      "justificativa",
    ],
    TRANSFERENCIA_CC: ["novoCentroCusto", "novaPlanta", "dataVigencia", "justificativa"],
  };

  const evidenciasPorTipo: Record<string, (keyof NovaMovimentacaoInput)[]> = {
    MUDANCA_GESTOR: ["justificativaAnexo"],
    ALTERACAO_SALARIAL: ["offerLetter"],
    TRANSFERENCIA_CC: ["creqEreq"],
  };

  return [
    ["tipo"],
    ["colaboradorId", "colaboradorNome", "colaboradorMatricula"],
    tipo ? dadosPorTipo[tipo] ?? [] : [],
    tipo ? evidenciasPorTipo[tipo] ?? [] : [],
  ];
}
