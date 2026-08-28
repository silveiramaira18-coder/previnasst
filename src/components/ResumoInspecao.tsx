import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
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
    { rotulo: "➖ Não aplicáveis", valor: data.naoAplicaveis },
    { rotulo: "📸 Evidências", valor: data.fotos },
    { rotulo: "Não conformidades", valor: data.ncs },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {blocos.map((b) => (
            <div key={b.rotulo} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{b.rotulo}</p>
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
