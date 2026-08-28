import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  TriangleAlert,
  CheckCircle2,
  Clock,
  Wrench,
  CalendarClock,
  Camera,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { indicadores, conformidadeMensal, inspecoes } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Previna SST — Inspeções de Segurança do Trabalho" },
      {
        name: "description",
        content:
          "Dashboard do Previna SST com indicadores de conformidade, não conformidades e ações corretivas de obras e empresas.",
      },
      { property: "og:title", content: "Previna SST — Inspeções de Segurança do Trabalho" },
      {
        property: "og:description",
        content:
          "Registre inspeções de segurança em campo e acompanhe conformidade, NCs e ações corretivas.",
      },
    ],
  }),
  component: Dashboard,
});

const cards = [
  { label: "Inspeções realizadas", value: indicadores.inspecoes, icon: ClipboardList, tone: "text-primary" },
  { label: "Não conformidades", value: indicadores.naoConformidades, icon: TriangleAlert, tone: "text-critical" },
  { label: "Itens conformes", value: indicadores.conformes, icon: CheckCircle2, tone: "text-success" },
  { label: "Itens pendentes", value: indicadores.pendentes, icon: Clock, tone: "text-warning" },
  { label: "Ações corretivas abertas", value: indicadores.acoesAbertas, icon: Wrench, tone: "text-info" },
  { label: "Ações corretivas atrasadas", value: indicadores.acoesAtrasadas, icon: CalendarClock, tone: "text-critical" },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral das inspeções de segurança do trabalho."
        action={
          <Button asChild size="lg" className="gap-2">
            <Link to="/nova-inspecao">
              <Camera className="size-4" /> Nova Inspeção
            </Link>
          </Button>
        }
      />

      <p className="text-xs text-muted-foreground">
        Indicadores demonstrativos — nenhum dado real está conectado nesta etapa.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary">
                <c.icon className={`size-5 ${c.tone}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{c.value}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Percentual de conformidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-5xl font-bold text-success">{indicadores.conformidade}%</p>
            <Progress value={indicadores.conformidade} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {indicadores.conformes} itens conformes de{" "}
              {indicadores.conformes + indicadores.naoConformidades + indicadores.pendentes}{" "}
              verificados.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução da conformidade</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={conformidadeMensal} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[50, 100]} tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Conformidade"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="conformidade"
                  stroke="var(--color-success)"
                  strokeWidth={2.5}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas inspeções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inspecoes.slice(0, 4).map((i) => (
            <Link
              key={i.id}
              to="/inspecoes/$id"
              params={{ id: i.id }}
              className="block rounded-xl border p-4 transition-colors hover:bg-secondary"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="truncate font-semibold">
                  {i.id} · {i.obra}
                </p>
                <StatusBadge value={i.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {i.data} às {i.hora} · {i.local}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
