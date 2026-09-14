import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { STATUS_APROVACAO_LABEL } from "../types";
import type { StatusAprovacao } from "../types";

const STATUS_CONFIG: Record<
  StatusAprovacao,
  { variant: NonNullable<BadgeProps["variant"]>; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDENTE_GESTOR: { variant: "amber", icon: Clock },
  PENDENTE_RH: { variant: "blue", icon: Clock },
  PROCESSANDO: { variant: "purple", icon: Loader2 },
  CONCLUIDO: { variant: "green", icon: CheckCircle2 },
  RECUSADO: { variant: "red", icon: XCircle },
};

export function StatusBadge({ status }: { status: StatusAprovacao }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <Icon className={cnAnimateIfProcessing(status)} aria-hidden />
      {STATUS_APROVACAO_LABEL[status]}
    </Badge>
  );
}

function cnAnimateIfProcessing(status: StatusAprovacao): string {
  return status === "PROCESSANDO" ? "h-3 w-3 animate-spin" : "h-3 w-3";
}
