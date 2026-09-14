"use client";

import { useFormContext } from "react-hook-form";
import type { NovaMovimentacaoInput } from "../../schemas";
import { FileUploadField } from "./file-upload-field";

export function StepEvidencias() {
  const { watch } = useFormContext<NovaMovimentacaoInput>();
  const tipo = watch("tipo");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Upload de evidências</h2>
        <p className="text-sm text-muted-foreground">
          Anexe os documentos que comprovam e justificam a movimentação.
        </p>
      </div>

      {tipo === "ALTERACAO_SALARIAL" ? (
        <FileUploadField
          name="offerLetter"
          label="Offer letter / comprovante de aprovação"
          description="Documento assinado com a aprovação da nova condição salarial."
          required
        />
      ) : null}

      {tipo === "TRANSFERENCIA_CC" ? (
        <FileUploadField
          name="creqEreq"
          label="C-req / E-req"
          description="Requisição de headcount ou de estrutura aprovada para a transferência."
          required
        />
      ) : null}

      <FileUploadField
        name="justificativaAnexo"
        label="Justificativa (anexo complementar)"
        description="Opcional: documentos adicionais que embasam a solicitação."
      />
    </div>
  );
}
