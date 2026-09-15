import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { resumoInspecao } from "@/lib/itens";

export function ResumoInspecao({ inspecaoId }: { inspecaoId: string }) {
  const { data } = useQuery({
    queryKey: ["resumo", inspecaoId],
    queryFn: () => resumoInspecao(inspecaoId),
  });

  if (!data) return null;

  const blocos = [
    { rotulo: "Itens avaliados", valor: data.total },
    { rotulo: "✅ Conformes", valor: data.conformes },
    { rotulo: "❌ Não conformes", valor: data.naoConformes },
    {
      rotulo: "Conformidade",
      valor: `${data.conformidade.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`,
    },
    {
      rotulo: "🚨 NCs atrasadas",
      valor: data.ncsAtrasadas,
      estilo: "border-destructive/50 bg-destructive/10 text-destructive",
    },
    {
      rotulo: "⏳ NCs a vencer",
      valor: data.ncsAVencer,
      estilo: "border-warning/50 bg-warning/10 text-warning-foreground",
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {blocos.map((b) => (
            <div key={b.rotulo} className={cn("rounded-xl border p-3", b.estilo)}>
              <p className="text-xs opacity-80">{b.rotulo}</p>
              <p className="mt-1 text-2xl font-bold">{b.valor}</p>
            </div>
          ))}
        </div>

        <p className="text-sm">
          Conformidade:{" "}
          <span className="text-lg font-bold">
            {data.conformidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          </span>
          {data.pendentes > 0 ? (
            <span className="ml-2 text-muted-foreground">
              ({data.pendentes} item(ns) sem resposta)
            </span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
}
