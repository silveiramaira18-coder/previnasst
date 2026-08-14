import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ImageIcon } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inspecoes, naoConformidades, acoesCorretivas } from "@/lib/mock-data";

export const Route = createFileRoute("/inspecoes/$id")({
  loader: ({ params }) => {
    const inspecao = inspecoes.find((i) => i.id === params.id);
    if (!inspecao) throw notFound();
    return { inspecao };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Inspeção não encontrada — SafeCheck" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `Inspeção ${loaderData.inspecao.id} — SafeCheck`;
    const description = `Detalhes da inspeção ${loaderData.inspecao.id} na obra ${loaderData.inspecao.obra}, com evidências e não conformidades.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: DetalheInspecao,
});

function DetalheInspecao() {
  const { inspecao } = Route.useLoaderData();
  const ncs = naoConformidades.filter((n) => n.inspecao === inspecao.id);
  const acoes = acoesCorretivas.filter((a) => ncs.some((n) => n.id === a.nc));

  const dados = [
    ["Obra", inspecao.obra],
    ["Data", inspecao.data],
    ["Horário", inspecao.hora],
    ["Responsável", inspecao.responsavel],
    ["Local / setor", inspecao.local],
    ["Tipo", inspecao.tipo],
  ] as const;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2">
        <Link to="/inspecoes">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </Button>

      <PageHeader
        title={`Inspeção ${inspecao.id}`}
        description={inspecao.obra}
        action={<StatusBadge value={inspecao.status} />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da inspeção</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dados.map(([label, valor]) => (
            <div key={label}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-0.5 font-medium">{valor}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações gerais</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          {inspecao.observacoes}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Galeria de fotos ({inspecao.fotos})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: inspecao.fotos }).map((_, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="grid aspect-square place-items-center rounded-xl border border-dashed bg-muted text-muted-foreground">
                  <ImageIcon className="size-6" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Evidência {idx + 1} — imagem não disponível nesta demonstração
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Não conformidades relacionadas ({ncs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ncs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma não conformidade registrada nesta inspeção.
            </p>
          ) : (
            ncs.map((nc) => (
              <div key={nc.id} className="rounded-xl border p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <p className="truncate font-semibold">
                    {nc.id} · {nc.categoria}
                  </p>
                  <StatusBadge value={nc.severidade} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{nc.descricao}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <StatusBadge value={nc.status} />
                  <span className="text-muted-foreground">Prazo: {nc.prazo}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações corretivas relacionadas ({acoes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {acoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ação corretiva vinculada.</p>
          ) : (
            acoes.map((a) => (
              <div key={a.id} className="rounded-xl border p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <p className="truncate font-semibold">
                    {a.id} · {a.nc}
                  </p>
                  <StatusBadge value={a.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.acao}</p>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
                  <span>{a.responsavel}</span>
                  <span className="text-muted-foreground">Prazo: {a.prazo}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}