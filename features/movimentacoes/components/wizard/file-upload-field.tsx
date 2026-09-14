"use client";

import { useFormContext } from "react-hook-form";
import type { FieldError, Merge } from "react-hook-form";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_EXTENSIONS } from "../../schemas";
import type { NovaMovimentacaoInput } from "../../schemas";

type ArquivoFieldName = "offerLetter" | "creqEreq" | "justificativaAnexo";

interface FileUploadFieldProps {
  name: ArquivoFieldName;
  label: string;
  description?: string;
  required?: boolean;
}

export function FileUploadField({ name, label, description, required }: FileUploadFieldProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<NovaMovimentacaoInput>();

  const files = watch(name) ?? [];
  const fieldError = errors[name] as
    | Merge<FieldError, (FieldError | undefined)[]>
    | FieldError
    | undefined;
  const errorMessage =
    fieldError && "message" in fieldError && fieldError.message
      ? fieldError.message
      : Array.isArray(fieldError)
        ? fieldError.find((item) => item?.message)?.message
        : undefined;

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const novos = Array.from(fileList);
    setValue(name, [...files, ...novos], { shouldValidate: true, shouldDirty: true });
  }

  function removeFile(index: number) {
    setValue(
      name,
      files.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </label>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}

      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors hover:border-primary/60 hover:bg-accent",
          errorMessage && "border-destructive"
        )}
      >
        <Upload className="h-5 w-5 text-muted-foreground" aria-hidden />
        <span className="text-sm text-muted-foreground">
          Clique para selecionar ou arraste arquivos PDF/PNG (máx. 5MB)
        </span>
        <input
          type="file"
          multiple
          accept={ACCEPTED_FILE_EXTENSIONS}
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {files.length > 0 ? (
        <ul className="space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                aria-label={`Remover ${file.name}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
