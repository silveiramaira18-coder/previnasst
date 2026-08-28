import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FotoDialog } from "@/components/FotoDialog";
import { FotoManager } from "@/components/FotoManager";
import { ItensInspecao } from "@/components/ItensInspecao";
import { ItensInspecaoView } from "@/components/ItensInspecaoView";
import { ResumoInspecao } from "@/components/ResumoInspecao";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  formatarData,
  formatarHora,
  listarNCsDaInspecao,
  obterInspecao,
  type AcaoCorretiva,
} from "@/lib/db";
import { categoriasChecklist } from "@/lib/mock-data";

export const Route = createFileRoute("/inspecoes/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da Inspeção — Previna SST" },
      {
        name: "description",
        content:
          "Detalhes da inspeção de segurança do trabalho com evidências fotográficas, não conformidades e ações corretivas.",
      },
      { property: "og:title", content: "Detalhe da Inspeção — Previna SST" },
      {
        property: "og:description",
        content: "Veja fotos, não conformidades e ações corretivas de uma inspeção.",
      },
    ],
  }),
  component: DetalheInspecao,
});

const SEVERIDADES = ["Baixa", "Média", "Alta", "Crítica"];
const STATUS_NC = ["Aberta", "Em tratativa", "Atrasada", "Concluída"];

function DetalheInspecao() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [ncAberta, setNcAberta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [ncForm, setNcForm] = useState({
    categoria: categoriasChecklist[0] ?? "",
    descricao: "",
    severidade: "Média",
    prazo: "",
    status: "Aberta",
    observacao: "",
  });

  const { data: inspecao, isLoading } = useQuery({
    queryKey: ["inspecao", id],
    queryFn: () => obterInspecao(id),
  });

  const { data: ncs = [] } = useQuery({
    queryKey: ["ncs", id],
    queryFn: () => listarNCsDaInspecao(id),
  });

  const { data: acoes = [] } = useQuery({
    queryKey: ["acoes-inspecao", id],
    queryFn: async () => {
      const ids = ncs.map((n) => n.id);
      if (ids.length === 0) return [] as AcaoCorretiva[];
      const { data, error } = await supabase
        .from("acoes_corretivas")
        .select("*")
        .in("nao_conformidade_id", ids);
      if (error) throw new Error(error.message);
      return (data ?? []) as AcaoCorretiva[];
    },
    enabled: ncs.length > 0,
  });

  const criarNC = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nao_conformidades").insert({
        inspecao_id: id,
        categoria: ncForm.categoria,
        descricao: ncForm.descricao,
        severidade: ncForm.severidade,
        prazo: ncForm.prazo || null,
        status: ncForm.status,
        observacao: ncForm.observacao || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ncs", id] });
      qc.invalidateQueries({ queryKey: ["ncs-todas"] });
      setNcAberta(false);
      setNcForm({ ...ncForm, descricao: "", prazo: "", observacao: "" });
      toast.success("Não conformidade registrada");
    },
    onError: (e: Error) => toast.error("Erro ao registrar NC", { description: e.message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando inspeção...</p>;
  if (!inspecao) return <p className="text-sm text-muted-foreground">Inspeção não encontrada.</p>;

  const dados = [
    ["Obra", inspecao.obras?.nome ?? "—"],
    ["Data", formatarData(inspecao.data)],
    ["Horário", formatarHora(inspecao.horario)],
    ["Responsável", inspecao.responsavel ?? "—"],
    ["Local / setor", inspecao.local ?? "—"],
    ["Tipo", inspecao.tipo_inspecao ?? "—"],
  ] as const;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
        <Link to="/inspecoes">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </Button>

      <PageHeader
        title={`Inspeção ${inspecao.numero}`}
        description={inspecao.obras?.nome ?? "Sem obra vinculada"}
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
          {inspecao.observacoes || "Sem observações registradas."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo da inspeção</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumoInspecao inspecaoId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Itens da inspeção</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditando((v) => !v)}>
            {editando ? "Ver resultado" : "Editar itens"}
          </Button>
        </CardHeader>
        <CardContent>
          {editando ? (
            <ItensInspecao inspecaoId={id} obraId={inspecao.obra_id} />
          ) : (
            <ItensInspecaoView inspecaoId={id} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evidências fotográficas gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <FotoManager
            tabela="fotos_inspecao"
            coluna="inspecao_id"
            valor={id}
            titulo="Fotos gerais da inspeção"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Não conformidades ({ncs.length})</CardTitle>
          <Dialog open={ncAberta} onOpenChange={setNcAberta}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="size-4" /> Nova NC
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova não conformidade</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  criarNC.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select
                    value={ncForm.categoria}
                    onValueChange={(v) => setNcForm({ ...ncForm, categoria: v })}
                  >
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasChecklist.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desc">Descrição</Label>
                  <Textarea
                    id="desc"
                    required
                    rows={3}
                    value={ncForm.descricao}
                    onChange={(e) => setNcForm({ ...ncForm, descricao: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Severidade</Label>
                    <Select
                      value={ncForm.severidade}
                      onValueChange={(v) => setNcForm({ ...ncForm, severidade: v })}
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERIDADES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={ncForm.status}
                      onValueChange={(v) => setNcForm({ ...ncForm, status: v })}
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_NC.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prazo">Prazo</Label>
                  <Input
                    id="prazo"
                    type="date"
                    className="h-12"
                    value={ncForm.prazo}
                    onChange={(e) => setNcForm({ ...ncForm, prazo: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="obs-nc">Observação</Label>
                  <Textarea
                    id="obs-nc"
                    rows={2}
                    value={ncForm.observacao}
                    onChange={(e) => setNcForm({ ...ncForm, observacao: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" size="lg" className="h-12 w-full" disabled={criarNC.isPending}>
                    Registrar não conformidade
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                    {nc.numero} · {nc.categoria}
                  </p>
                  <StatusBadge value={nc.severidade} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{nc.descricao}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <StatusBadge value={nc.status} />
                  <span className="text-muted-foreground">Prazo: {formatarData(nc.prazo)}</span>
                  <FotoDialog
                    tabela="fotos_nao_conformidade"
                    coluna="nao_conformidade_id"
                    valor={nc.id}
                    titulo={`Fotos da NC ${nc.numero}`}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações corretivas ({acoes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {acoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ação corretiva vinculada.</p>
          ) : (
            acoes.map((a) => (
              <div key={a.id} className="rounded-xl border p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <p className="truncate font-semibold">{a.numero}</p>
                  <StatusBadge value={a.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.descricao}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>{a.responsavel}</span>
                  <span className="text-muted-foreground">Prazo: {formatarData(a.prazo)}</span>
                  <FotoDialog
                    tabela="fotos_acao_corretiva"
                    coluna="acao_corretiva_id"
                    valor={a.id}
                    titulo={`Fotos da ação ${a.numero}`}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
