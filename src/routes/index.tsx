import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ClipboardList,
  TriangleAlert,
  CheckCircle2,
  Clock,
  Wrench,
  CalendarClock,
  Camera,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  carregarIndicadores,
  carregarResumoPorUsuario,
  formatarData,
  listarInspecoes,
} from "@/lib/db";
import { usePerfil } from "@/lib/perfil";

export const Route = createFileRoute("/")({
  ssr: false,
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

function Dashboard() {
  const { perfil, adminPrincipal } = usePerfil();
  const [boasVindas, setBoasVindas] = useState(false);

  const { data: ind, isLoading } = useQuery({
    queryKey: ["indicadores"],
    queryFn: carregarIndicadores,
  });
  const { data: inspecoes = [] } = useQuery({ queryKey: ["inspecoes"], queryFn: listarInspecoes });
  const { data: porUsuario = [] } = useQuery({
    queryKey: ["resumo-usuarios"],
    queryFn: carregarResumoPorUsuario,
    enabled: adminPrincipal,
  });

  const primeiroNome = (perfil?.nome || perfil?.email || "").split(" ")[0] ?? "";

  useEffect(() => {
    if (!perfil) return;
    const chave = `previna-boas-vindas-${perfil.id}`;
    if (sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, "1");
    setBoasVindas(true);
    const t = setTimeout(() => setBoasVindas(false), 8000);
    return () => clearTimeout(t);
  }, [perfil]);

  const cards = [
    { label: "Obras cadastradas", value: ind?.obras ?? 0, icon: Building2, tone: "text-primary" },
    {
      label: "Inspeções realizadas",
      value: ind?.inspecoes ?? 0,
      icon: ClipboardList,
      tone: "text-primary",
    },
    {
      label: "Não conformidades",
      value: ind?.naoConformidades ?? 0,
      icon: TriangleAlert,
      tone: "text-critical",
    },
    { label: "Itens conformes", value: ind?.conformes ?? 0, icon: CheckCircle2, tone: "text-success" },
    { label: "Itens pendentes", value: ind?.pendentes ?? 0, icon: Clock, tone: "text-warning" },
    {
      label: "Ações corretivas abertas",
      value: ind?.acoesAbertas ?? 0,
      icon: Wrench,
      tone: "text-info",
    },
    {
      label: "Ações corretivas atrasadas",
      value: ind?.acoesAtrasadas ?? 0,
      icon: CalendarClock,
      tone: "text-critical",
    },
  ];

  const vazio = !isLoading && (ind?.obras ?? 0) === 0 && (ind?.inspecoes ?? 0) === 0;

  return (
    <div className="space-y-6">
      {boasVindas ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-5">
            <p className="font-display text-lg font-bold">
              Bem-vinda(o) ao Previna SST{primeiroNome ? `, ${primeiroNome}` : ""}!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {vazio
                ? "Seu painel está pronto para começar. Cadastre sua primeira obra e realize sua primeira Inspeção de Segurança do Trabalho."
                : "Bom trabalho! Acompanhe abaixo os indicadores das suas inspeções."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <PageHeader
        title="Dashboard"
        description={
          adminPrincipal
            ? "Visão geral de todas as inspeções do sistema."
            : "Visão geral das suas inspeções de segurança do trabalho."
        }
        action={
          <Button asChild size="lg" className="gap-2">
            <Link to="/nova-inspecao">
              <Camera className="size-4" /> Nova Inspeção
            </Link>
          </Button>
        }
      />

      {vazio ? (
        <Card className="border-dashed">
          <CardContent className="space-y-3 p-6 text-center">
            <p className="font-semibold">Seu painel está pronto para começar.</p>
            <p className="text-sm text-muted-foreground">
              Comece cadastrando sua primeira obra para acompanhar suas inspeções de segurança.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Button asChild size="lg">
                <Link to="/obras">Cadastrar obra</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/nova-inspecao">Nova inspeção</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Percentual de conformidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-5xl font-bold text-success">{ind?.conformidade ?? 0}%</p>
          <Progress value={ind?.conformidade ?? 0} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {ind?.conformes ?? 0} itens conformes de{" "}
            {(ind?.conformes ?? 0) + (ind?.naoConformes ?? 0)} itens avaliados.
          </p>
        </CardContent>
      </Card>

      {adminPrincipal ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" /> Painel da administradora — {porUsuario.length} usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Obras</TableHead>
                  <TableHead className="text-right">Inspeções</TableHead>
                  <TableHead className="text-right">NCs</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porUsuario.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      {u.nome}
                      {u.cargo ? (
                        <span className="block text-xs text-muted-foreground">{u.cargo}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.empresa ?? "—"}</TableCell>
                    <TableCell className="text-right">{u.obras}</TableCell>
                    <TableCell className="text-right">{u.inspecoes}</TableCell>
                    <TableCell className="text-right">{u.ncs}</TableCell>
                    <TableCell className="text-right">{u.acoes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {inspecoes.length > 0 ? (
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
                    {i.numero} · {i.obras?.nome ?? "Sem obra"}
                  </p>
                  <StatusBadge value={i.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatarData(i.data)} · {i.local ?? "Local não informado"}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
