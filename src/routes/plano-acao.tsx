import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlarmClock, ArrowLeft, ArrowRight, Check, Copy, Images, Mail, Share2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { enviarCobrancaNC, gerarLinkNC } from "@/lib/portal.functions";
import { formatarData, ncVencida } from "@/lib/db";
import {
  COLUNAS_V2,
  colunaDaNC,
  aprovarPlano,
  listarPlanosAcao,
  moverPlano,
  rejeitarPlano,
  STATUS_VALIDACAO,
  venceEm48h,
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
  const reenviar = useServerFn(enviarCobrancaNC);
  const [enviando, setEnviando] = useState(false);
  const coluna = colunaDaNC(nc);
  const indice = ordem.indexOf(coluna);
  const anterior = ordem[indice - 1];
  const proxima = ordem[indice + 1];

  return (
    <Card
      className="border-l-4"
      style={{ borderLeftColor: ncVencida(nc) ? "var(--color-destructive)" : venceEm48h(nc) ? "var(--color-warning, orange)" : "var(--color-border)" }}
    >
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
        {coluna !== "concluido" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            disabled={enviando}
            onClick={async () => {
              setEnviando(true);
              try {
                await reenviar({ data: { ncId: nc.id, origem: window.location.origin } });
                toast.success("Cobrança reenviada ao responsável");
              } catch (e) {
                toast.error("Não foi possível reenviar", { description: (e as Error).message });
              } finally {
                setEnviando(false);
              }
            }}
          >
            <Mail className="size-4" /> {enviando ? "Enviando..." : "Reenviar cobrança"}
          </Button>
        ) : null}
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
  const [severidade, setSeveridade] = useState("todas");
  const [obra, setObra] = useState("todas");
  const [soAtrasadas, setSoAtrasadas] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [rejeitando, setRejeitando] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const gerarLink = useServerFn(gerarLinkNC);

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

  const decidir = useMutation({
    mutationFn: async (acao: "aprovar" | "rejeitar") => {
      if (!detalhe) return;
      if (acao === "aprovar") await aprovarPlano(detalhe.id);
      else {
        if (!motivo.trim()) throw new Error("Informe o motivo da recusa.");
        await rejeitarPlano(detalhe.id, motivo.trim());
      }
    },
    onSuccess: (_d, acao) => {
      qc.invalidateQueries({ queryKey: ["planos-acao"] });
      qc.invalidateQueries({ queryKey: ["ncs-todas"] });
      toast.success(acao === "aprovar" ? "Plano aprovado e concluído" : "Ajuste solicitado ao responsável");
      setDetalhe(null);
      setMotivo("");
      setRejeitando(false);
    },
    onError: (e: Error) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  const nomeObra = (p: PlanoAcao) => p.obras?.nome ?? p.inspecoes?.obras?.nome ?? "Obra não informada";
  const obras = [...new Set(planos.map(nomeObra))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const atrasadas = planos.filter((p) => ncVencida(p)).length;
  const proximas = planos.filter((p) => venceEm48h(p)).length;

  const termo = busca.trim().toLowerCase();
  const filtrados = planos.filter(
    (p) =>
      (!termo ||
        p.numero.toLowerCase().includes(termo) ||
        (p.descricao ?? "").toLowerCase().includes(termo) ||
        nomeObra(p).toLowerCase().includes(termo)) &&
      (severidade === "todas" || (p.severidade ?? "").toLowerCase().startsWith(severidade)) &&
      (obra === "todas" || nomeObra(p) === obra) &&
      (!soAtrasadas || ncVencida(p)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plano de Ação"
        description="Acompanhe cada não conformidade por etapa até a validação final."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setSoAtrasadas((v) => !v)}
          className={`flex items-center gap-3 rounded-xl border p-4 text-left ${soAtrasadas ? "border-destructive bg-destructive/10" : ""}`}
        >
          <AlarmClock className="size-6 text-destructive" />
          <div>
            <p className="text-2xl font-bold">{atrasadas}</p>
            <p className="text-sm text-muted-foreground">Pendências atrasadas {soAtrasadas ? "(filtrando)" : "— toque para filtrar"}</p>
          </div>
        </button>
        <div className="flex items-center gap-3 rounded-xl border p-4">
          <AlarmClock className="size-6 text-warning" />
          <div>
            <p className="text-2xl font-bold">{proximas}</p>
            <p className="text-sm text-muted-foreground">Vencem nas próximas 48 horas</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="h-12 max-w-md"
          placeholder="Buscar por código, descrição ou obra"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="h-12 rounded-md border bg-background px-3 text-sm" value={severidade} onChange={(e) => setSeveridade(e.target.value)} aria-label="Severidade">
          <option value="todas">Todas as severidades</option>
          <option value="crít">Crítico</option>
          <option value="méd">Médio</option>
          <option value="baix">Baixo</option>
        </select>
        <select className="h-12 max-w-xs rounded-md border bg-background px-3 text-sm" value={obra} onChange={(e) => setObra(e.target.value)} aria-label="Obra">
          <option value="todas">Todas as obras</option>
          {obras.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

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

      <Dialog
        open={!!detalhe}
        onOpenChange={(v) => {
          if (!v) {
            setDetalhe(null);
            setLink(null);
            setRejeitando(false);
            setMotivo("");
          }
        }}
      >
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
                <p className="text-xs text-muted-foreground">
                  Setor: {detalhe.itens_inspecao?.local || "—"} · NR:{" "}
                  {detalhe.itens_inspecao?.normas_regulamentadoras?.join(", ") || "—"}
                </p>
                {detalhe.motivo_rejeicao && detalhe.status !== "Concluída" ? (
                  <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                    Último ajuste solicitado: {detalhe.motivo_rejeicao}
                  </p>
                ) : null}
              </div>

              <ComparativoFotos ncId={detalhe.id} itemId={detalhe.item_inspecao_id} />

              {detalhe.status === STATUS_VALIDACAO ? (
                <div className="space-y-3 rounded-xl border p-3">
                  <p className="text-sm font-semibold">Validar a correção enviada</p>
                  {rejeitando ? (
                    <Textarea placeholder="Motivo da recusa (obrigatório)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button className="h-12 flex-1" disabled={decidir.isPending} onClick={() => decidir.mutate("aprovar")}>
                      <Check className="size-4" /> Aprovar e concluir
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-12 flex-1"
                      disabled={decidir.isPending}
                      onClick={() => (rejeitando ? decidir.mutate("rejeitar") : setRejeitando(true))}
                    >
                      <X className="size-4" /> {rejeitando ? "Confirmar recusa" : "Rejeitar e solicitar ajuste"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {detalhe.status !== "Concluída" ? (
                <div className="space-y-2 rounded-xl border p-3">
                  <p className="text-sm font-semibold">Compartilhar ação com o responsável da obra</p>
                  {link ? (
                    <div className="flex gap-2">
                      <Input readOnly value={link} onFocus={(e) => e.target.select()} />
                      <Button variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copiado"); }}>
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-12 w-full"
                      onClick={async () => {
                        try {
                          const r = await gerarLink({ data: { ncId: detalhe.id, origem: window.location.origin } });
                          setLink(r.url);
                        } catch (e) {
                          toast.error("Não foi possível gerar o link", { description: (e as Error).message });
                        }
                      }}
                    >
                      <Share2 className="size-4" /> Gerar link de resposta
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Quem abrir o link vê a foto do problema e envia a foto da correção, sem precisar entrar no sistema.
                  </p>
                </div>
              ) : null}

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
