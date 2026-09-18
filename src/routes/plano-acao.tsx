import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Images } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ComparativoFotos } from "@/components/ComparativoFotos";
import { FotoManager } from "@/components/FotoManager";
import { PageHeader } from "@/components/PageHeader";
import { PrazoBadge } from "@/components/PrazoBadge";
import { RequerV2 } from "@/components/RequerV2";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatarData } from "@/lib/db";
import {
  COLUNAS_V2,
  colunaDaNC,
  listarPlanosAcao,
  moverPlano,
  type ColunaV2,
  type PlanoAcao,
} from "@/lib/v2";

export const Route = createFileRoute("/plano-acao")({
  head: () => ({
    meta: [
      { title: "Plano de Ação — Previna SST" },
      {
        name: "description",
        content:
          "Painel de planos de ação das não conformidades por etapa: aberto, em tratativa, aguardando validação e concluído.",
      },
      { property: "og:title", content: "Plano de Ação — Previna SST" },
      {
        property: "og:description",
        content: "Acompanhe a tratativa das não conformidades e compare foto do problema e da solução.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequerV2>
      <PlanoAcaoPage />
    </RequerV2>
  ),
});

const ordem = COLUNAS_V2.map((c) => c.chave);

function CardPlano({
  nc,
  onMover,
  onAbrir,
}: {
  nc: PlanoAcao;
  onMover: (destino: ColunaV2) => void;
  onAbrir: () => void;
}) {
  const coluna = colunaDaNC(nc);
  const indice = ordem.indexOf(coluna);
  const anterior = ordem[indice - 1];
  const proxima = ordem[indice + 1];

  return (
    <Card className="border-l-4" style={{ borderLeftColor: "var(--color-border)" }}>
      <CardContent className="space-y-2 p-3">
        <button type="button" className="w-full space-y-2 text-left" onClick={onAbrir}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{nc.numero}</span>
            <StatusBadge value={nc.severidade} />
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">{nc.descricao}</p>
          <p className="text-xs text-muted-foreground">
            {nc.obras?.nome ?? nc.inspecoes?.obras?.nome ?? "Obra não informada"}
            {nc.itens_inspecao?.local ? ` · ${nc.itens_inspecao.local}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">Prazo: {formatarData(nc.prazo)}</p>
          <PrazoBadge nc={nc} />
        </button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={!anterior}
            onClick={() => anterior && onMover(anterior)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={!proxima}
            onClick={() => proxima && onMover(proxima)}
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanoAcaoPage() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<PlanoAcao | null>(null);

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ["planos-acao"],
    queryFn: listarPlanosAcao,
  });

  const mover = useMutation({
    mutationFn: ({ id, destino }: { id: string; destino: ColunaV2 }) => moverPlano(id, destino),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planos-acao"] });
      qc.invalidateQueries({ queryKey: ["indicadores"] });
      qc.invalidateQueries({ queryKey: ["indicadores-v2"] });
      qc.invalidateQueries({ queryKey: ["ncs-todas"] });
      toast.success("Plano de ação atualizado");
    },
    onError: (e: Error) => toast.error("Não foi possível atualizar", { description: e.message }),
  });

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? planos.filter(
        (p) =>
          p.numero.toLowerCase().includes(termo) ||
          (p.descricao ?? "").toLowerCase().includes(termo) ||
          (p.obras?.nome ?? "").toLowerCase().includes(termo),
      )
    : planos;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plano de Ação"
        description="Acompanhe cada não conformidade por etapa até a validação final."
      />

      <Input
        className="h-12 max-w-md"
        placeholder="Buscar por código, descrição ou obra"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando planos de ação...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUNAS_V2.map((col) => {
            const itens = filtrados.filter((p) => colunaDaNC(p) === col.chave);
            return (
              <section key={col.chave} className="space-y-3 rounded-xl bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{col.titulo}</h2>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                    {itens.length}
                  </span>
                </div>
                {itens.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Nada nesta etapa
                  </p>
                ) : (
                  itens.map((nc) => (
                    <CardPlano
                      key={nc.id}
                      nc={nc}
                      onAbrir={() => setDetalhe(nc)}
                      onMover={(destino) => mover.mutate({ id: nc.id, destino })}
                    />
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Images className="size-5" /> {detalhe?.numero} — comparativo visual
            </DialogTitle>
          </DialogHeader>
          {detalhe ? (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-sm">{detalhe.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {detalhe.obras?.nome ?? detalhe.inspecoes?.obras?.nome ?? "Obra não informada"} ·
                  Prazo {formatarData(detalhe.prazo)} · Responsável{" "}
                  {detalhe.responsaveis?.join(", ") || detalhe.responsavel || "—"}
                </p>
              </div>

              <ComparativoFotos ncId={detalhe.id} itemId={detalhe.item_inspecao_id} />

              <div className="rounded-xl border p-3">
                <FotoManager
                  tabela="fotos_nao_conformidade"
                  coluna="nao_conformidade_id"
                  valor={detalhe.id}
                  tipo="solucao"
                  titulo="Enviar foto da solução / adequação"
                  rotuloUpload="+ Adicionar evidência"
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
