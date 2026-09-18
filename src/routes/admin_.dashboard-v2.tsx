import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Gauge, TriangleAlert, CheckCircle2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/PageHeader";
import { RequerV2 } from "@/components/RequerV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { carregarIndicadoresV2 } from "@/lib/v2";

export const Route = createFileRoute("/admin_/dashboard-v2")({
  head: () => ({
    meta: [
      { title: "Dashboard de Tendências — Previna SST" },
      {
        name: "description",
        content:
          "Indicadores de segurança do trabalho: taxa de conformidade, severidade das não conformidades, NRs mais apontadas e tempo médio de resolução.",
      },
      { property: "og:title", content: "Dashboard de Tendências — Previna SST" },
      {
        property: "og:description",
        content: "Gráficos de conformidade, severidade, ranking de NRs e MTTR das não conformidades.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequerV2>
      <DashboardV2 />
    </RequerV2>
  ),
});

const CORES_SEVERIDADE: Record<string, string> = {
  "Crítico": "var(--color-destructive)",
  "Médio": "var(--color-warning)",
  "Baixo": "var(--color-info)",
};

function Metrica({
  titulo,
  valor,
  icone: Icone,
  tom,
}: {
  titulo: string;
  valor: string;
  icone: typeof Gauge;
  tom?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`grid size-10 place-items-center rounded-xl bg-muted ${tom ?? ""}`}>
          <Icone className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{titulo}</p>
          <p className="text-xl font-bold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardV2() {
  const { data, isLoading } = useQuery({
    queryKey: ["indicadores-v2"],
    queryFn: carregarIndicadoresV2,
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Carregando indicadores...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard de Tendências"
        description="Visão gerencial da conformidade, severidade e tempo de resposta às não conformidades."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica titulo="Taxa de conformidade" valor={`${data.conformidade}%`} icone={Gauge} />
        <Metrica
          titulo="Não conformidades abertas"
          valor={String(data.abertas)}
          icone={TriangleAlert}
          tom="text-destructive"
        />
        <Metrica
          titulo="Resolvidas"
          valor={String(data.resolvidas)}
          icone={CheckCircle2}
          tom="text-success"
        />
        <Metrica
          titulo="Tempo médio de resolução"
          valor={data.mttr === null ? "—" : `${data.mttr} dias`}
          icone={Clock}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Não conformidades por severidade</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.porSeveridade}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="nome" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {data.porSeveridade.map((s) => (
                    <Cell key={s.nome} fill={CORES_SEVERIDADE[s.nome] ?? "var(--color-primary)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">NRs com mais apontamentos</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {data.rankingNRs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem apontamentos por NR ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.rankingNRs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis type="category" dataKey="nr" width={90} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendência mensal (abertas x resolvidas)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {data.porMes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem histórico suficiente.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.porMes}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="abertas"
                  name="Abertas"
                  stroke="var(--color-destructive)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="resolvidas"
                  name="Resolvidas"
                  stroke="var(--color-success)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
