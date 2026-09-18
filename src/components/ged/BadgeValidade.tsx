import { situacaoDocumento } from "@/lib/ged";
import { cn } from "@/lib/utils";

const estilos: Record<string, string> = {
  valido: "bg-success/15 text-success border-success/30",
  atencao: "bg-warning/15 text-warning-foreground border-warning/40",
  vencido: "bg-destructive/15 text-destructive border-destructive/30",
  "sem-validade": "bg-muted text-muted-foreground border-border",
};

export function BadgeValidade({ validade }: { validade: string | null }) {
  const s = situacaoDocumento(validade);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        estilos[s.nivel],
      )}
    >
      {s.rotulo}
    </span>
  );
}
