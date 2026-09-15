import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Download, Pencil, Trash2 } from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AssinaturaInspecao } from "@/components/AssinaturaInspecao";
import { ItensInspecao } from "@/components/ItensInspecao";
import { ItensInspecaoView } from "@/components/ItensInspecaoView";
import { ResumoInspecao } from "@/components/ResumoInspecao";
import { PageHeader } from "@/components/PageHeader";
import { PrazoBadge } from "@/components/PrazoBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  formatarData,
  formatarHora,
  listarNCsPendentesDaObra,
  listarObras,
  obterInspecao,
  statusExibidoNC,
} from "@/lib/db";
import { gerarPdfInspecao } from "@/lib/pdf";

type BuscaInspecao = { editar?: boolean };

export const Route = createFileRoute("/inspecoes/$id")({
  validateSearch: (search: Record<string, unknown>): BuscaInspecao =>
    search["editar"] === true || search["editar"] === "true" ? { editar: true } : {},

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

const TIPOS_INSPECAO = ["Relatório de Segurança", "Outro"];

type FormInspecao = {
  obra_id: string;
  data: string;
  horario: string;
  responsavel: string;
  engenheiro_responsavel: string;
  email_engenheiro: string;
  tipo_inspecao: string;
  observacoes: string;
};

function DetalheInspecao() {
  const { id } = Route.useParams();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editando, setEditando] = useState(Boolean(busca.editar));
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [form, setForm] = useState<FormInspecao | null>(null);
  const [tipoOutro, setTipoOutro] = useState("");
  const blocoDados = useRef<HTMLDivElement>(null);

  const { data: inspecao, isLoading } = useQuery({
    queryKey: ["inspecao", id],
    queryFn: () => obterInspecao(id),
  });

  const { data: obras = [] } = useQuery({ queryKey: ["obras"], queryFn: listarObras });

  // Pendências ainda abertas da mesma obra, para evitar registro duplicado.
  const { data: pendentes = [] } = useQuery({
    queryKey: ["ncs-pendentes", inspecao?.obra_id, id],
    queryFn: () => listarNCsPendentesDaObra(inspecao?.obra_id as string, id),
    enabled: !!inspecao?.obra_id,
  });

  // Carrega o formulário com os dados atuais assim que a inspeção chega.
  useEffect(() => {
    if (!inspecao || form) return;
    const tipo = inspecao.tipo_inspecao ?? "";
    const conhecido = TIPOS_INSPECAO.includes(tipo);
    setForm({
      obra_id: inspecao.obra_id ?? "",
      data: inspecao.data ?? "",
      horario: inspecao.horario ? inspecao.horario.slice(0, 5) : "",
      responsavel: inspecao.responsavel ?? "",
      engenheiro_responsavel: inspecao.engenheiro_responsavel ?? "",
      email_engenheiro: inspecao.email_engenheiro ?? "",
      tipo_inspecao: tipo ? (conhecido ? tipo : "Outro") : "",
      observacoes: inspecao.observacoes ?? "",
    });
    if (tipo && !conhecido) setTipoOutro(tipo);
  }, [inspecao, form]);

  const salvarDados = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { error } = await supabase
        .from("inspecoes")
        .update({
          obra_id: form.obra_id || null,
          data: form.data,
          horario: form.horario || null,
          responsavel: form.responsavel || null,
          engenheiro_responsavel: form.engenheiro_responsavel || null,
          email_engenheiro: form.email_engenheiro || null,
          tipo_inspecao:
            (form.tipo_inspecao === "Outro" ? tipoOutro.trim() : form.tipo_inspecao) || null,
          observacoes: form.observacoes || null,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspecao", id] });
      qc.invalidateQueries({ queryKey: ["inspecoes-lista"] });
      qc.invalidateQueries({ queryKey: ["resumo", id] });
      qc.invalidateQueries({ queryKey: ["ncs-pendentes"] });
      toast.success("Alterações salvas");
    },
    onError: (e: Error) => toast.error("Erro ao salvar", { description: e.message }),
  });

  const finalizar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("inspecoes")
        .update({ status: "Concluída" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspecao", id] });
      qc.invalidateQueries({ queryKey: ["inspecoes-lista"] });
      toast.success("Inspeção finalizada");
    },
    onError: (e: Error) => toast.error("Erro ao finalizar", { description: e.message }),
  });

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inspecoes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspecoes-lista"] });
      toast.success("Inspeção excluída");
      navigate({ to: "/inspecoes" });
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  const baixarPdf = async () => {
    setGerandoPdf(true);
    try {
      await gerarPdfInspecao(id);
      toast.success("Relatório gerado");
    } catch (e) {
      toast.error("Erro ao gerar PDF", { description: (e as Error).message });
    } finally {
      setGerandoPdf(false);
    }
  };

  const abrirEdicao = () => {
    setEditando(true);
    requestAnimationFrame(() =>
      blocoDados.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando inspeção...</p>;
  if (!inspecao) return <p className="text-sm text-muted-foreground">Inspeção não encontrada.</p>;

  const dados = [
    ["Obra", inspecao.obras?.nome ?? "—"],
    ["Data", formatarData(inspecao.data)],
    ["Horário", formatarHora(inspecao.horario)],
    ["Responsável", inspecao.responsavel ?? "—"],
    ["Engenheiro responsável", inspecao.engenheiro_responsavel ?? "—"],
    ["E-mail do engenheiro", inspecao.email_engenheiro ?? "—"],
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

      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
        <Button
          variant={editando ? "default" : "outline"}
          size="lg"
          className="h-12 gap-2"
          onClick={abrirEdicao}
        >
          <Pencil className="size-4" /> Editar
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 gap-2"
          disabled={finalizar.isPending || inspecao.status === "Concluída"}
          onClick={() => finalizar.mutate()}
        >
          <CheckCircle2 className="size-4" /> Finalizar
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 gap-2"
          disabled={gerandoPdf}
          onClick={baixarPdf}
        >
          <Download className="size-4" /> Baixar PDF
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="h-12 gap-2"
          onClick={() => setConfirmarExclusao(true)}
        >
          <Trash2 className="size-4" /> Excluir
        </Button>
      </div>

      <Dialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deseja realmente excluir esta inspeção?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A inspeção {inspecao.numero} e todos os itens, fotos e não conformidades vinculados
            serão removidos definitivamente.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmarExclusao(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={excluir.isPending}
              onClick={() => excluir.mutate()}
            >
              Excluir inspeção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div ref={blocoDados} className="scroll-mt-20">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Dados da inspeção</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditando((v) => !v)}>
              {editando ? "Ver resultado" : "Editar"}
            </Button>
          </CardHeader>

          {editando && form ? (
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="obra">Obra</Label>
                <Select
                  value={form.obra_id}
                  onValueChange={(v) => {
                    const obra = obras.find((o) => o.id === v);
                    setForm({
                      ...form,
                      obra_id: v,
                      engenheiro_responsavel: obra?.engenheiro_responsavel ?? "",
                      email_engenheiro: obra?.email_engenheiro ?? "",
                    });
                  }}
                >
                  <SelectTrigger id="obra" className="h-12 w-full">
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {obras.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data">Data da inspeção</Label>
                <Input
                  id="data"
                  type="date"
                  className="h-12"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hora">Horário</Label>
                <Input
                  id="hora"
                  type="time"
                  className="h-12"
                  value={form.horario}
                  onChange={(e) => setForm({ ...form, horario: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inspetor">Responsável pela inspeção</Label>
                <Input
                  id="inspetor"
                  className="h-12"
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="engenheiro">Engenheiro responsável pela obra</Label>
                <Input
                  id="engenheiro"
                  className="h-12"
                  value={form.engenheiro_responsavel}
                  onChange={(e) => setForm({ ...form, engenheiro_responsavel: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="engenheiro-email">E-mail do engenheiro responsável</Label>
                <Input
                  id="engenheiro-email"
                  className="h-12"
                  placeholder="engenheiro@empresa.com.br"
                  value={form.email_engenheiro}
                  onChange={(e) => setForm({ ...form, email_engenheiro: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tipo">Tipo de inspeção</Label>
                <Select
                  value={form.tipo_inspecao}
                  onValueChange={(v) => setForm({ ...form, tipo_inspecao: v })}
                >
                  <SelectTrigger id="tipo" className="h-12 w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_INSPECAO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.tipo_inspecao === "Outro" ? (
                  <Input
                    className="mt-3 h-12"
                    maxLength={120}
                    placeholder="Informe o tipo de inspeção"
                    value={tipoOutro}
                    onChange={(e) => setTipoOutro(e.target.value)}
                  />
                ) : null}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="obs">Observações gerais</Label>
                <Textarea
                  id="obs"
                  rows={5}
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  size="lg"
                  className="h-12 w-full"
                  disabled={salvarDados.isPending}
                  onClick={() => salvarDados.mutate()}
                >
                  Salvar alterações
                </Button>
              </div>
            </CardContent>
          ) : (
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dados.map(([label, valor]) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-0.5 font-medium">{valor}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>

      {!editando ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações gerais</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {inspecao.observacoes || "Sem observações registradas."}
          </CardContent>
        </Card>
      ) : null}

      {pendentes.length > 0 ? (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="text-base">
              Não conformidades já registradas nesta obra ({pendentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Atualize a não conformidade existente em vez de cadastrar outra igual.
            </p>
            {pendentes.map((nc) => (
              <div key={nc.id} className="space-y-1 rounded-xl border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{nc.numero}</span>
                  <StatusBadge value={statusExibidoNC(nc)} />
                  <PrazoBadge nc={nc} />
                </div>
                <p className="text-sm text-muted-foreground">{nc.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  Registrada em {formatarData(nc.data_criacao.slice(0, 10))}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

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

      <div className="grid gap-6 lg:grid-cols-2">
        <AssinaturaInspecao
          inspecaoId={id}
          variante="inspetor"
          assinatura={inspecao.assinatura}
          nomeInicial={inspecao.assinatura_nome ?? inspecao.responsavel}
          cargoInicial={inspecao.assinatura_cargo}
          dataAssinatura={inspecao.assinatura_data}
        />
        <AssinaturaInspecao
          inspecaoId={id}
          variante="obra"
          assinatura={inspecao.assinatura_obra}
          nomeInicial={inspecao.assinatura_obra_nome ?? inspecao.engenheiro_responsavel}
          cargoInicial={inspecao.assinatura_obra_cargo}
          dataAssinatura={inspecao.assinatura_obra_data}
        />
      </div>
    </div>
  );
}
