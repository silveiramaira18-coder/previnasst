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
  const estiloPrazo =
    s.dias !== null && s.dias >= 0 && s.dias <= 7
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : s.dias !== null && s.dias <= 15
        ? "bg-warning/25 text-warning-foreground border-warning/50"
        : estilos[s.nivel];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        estiloPrazo,
      )}
    >
      {s.rotulo}
    </span>
  );
}
