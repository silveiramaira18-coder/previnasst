import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  // status gerais
  Concluída: "bg-success/12 text-success border-success/30",
  Ativo: "bg-success/12 text-success border-success/30",
  "Em andamento": "bg-info/12 text-info border-info/30",
  "Em tratativa": "bg-info/12 text-info border-info/30",
  Aberta: "bg-warning/18 text-warning-foreground border-warning/40",
  Rascunho: "bg-muted text-muted-foreground border-border",
  Paralisada: "bg-muted text-muted-foreground border-border",
  Atrasada: "bg-critical/12 text-critical border-critical/30",
  Vencida: "bg-destructive text-destructive-foreground border-destructive font-semibold",

  // severidades
  Baixa: "bg-muted text-muted-foreground border-border",
  Média: "bg-info/12 text-info border-info/30",
  Alta: "bg-warning/18 text-warning-foreground border-warning/40",
  Crítica: "bg-critical/12 text-critical border-critical/30",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", map[value] ?? "bg-muted text-muted-foreground")}
    >
      {value}
    </Badge>
  );
}