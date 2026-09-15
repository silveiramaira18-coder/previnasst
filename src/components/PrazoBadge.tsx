import { AlarmClock, TriangleAlert } from "lucide-react";

import { alertaPrazoDestaque, formatarData } from "@/lib/db";
import { cn } from "@/lib/utils";

/** Contador de prazo em destaque: vermelho para atrasadas, âmbar para as a vencer. */
export function PrazoBadge({
  nc,
  className,
}: {
  nc: { status: string; prazo: string | null };
  className?: string;
}) {
  const alerta = alertaPrazoDestaque(nc, true);
  if (!alerta) return null;

  const estilo =
    alerta.tom === "vencida"
      ? "bg-destructive text-destructive-foreground border-destructive"
      : alerta.tom === "hoje"
        ? "bg-warning text-warning-foreground border-warning"
        : "bg-warning/15 text-warning-foreground border-warning/40";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        estilo,
        className,
      )}
    >
      {alerta.tom === "prazo" ? (
        <AlarmClock className="size-3.5" />
      ) : (
        <TriangleAlert className="size-3.5" />
      )}
      {alerta.texto}
      {nc.prazo ? ` · ${formatarData(nc.prazo)}` : ""}
    </span>
  );
}
