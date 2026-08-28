import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  MinusCircle,
  Plus,
  Trash2,
  TriangleAlert,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FotoDialog } from "@/components/FotoDialog";
import { FotoManager } from "@/components/FotoManager";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { listarFotos } from "@/lib/fotos";
import {
  atualizarItem,
  criarItem,
  excluirItem,
  listarItens,
  reordenarItens,
  RESPOSTAS,
  statusDaResposta,
  type ItemInspecao,
} from "@/lib/itens";
import { categoriasChecklist } from "@/lib/mock-data";

const SEVERIDADES = ["Baixa", "Média", "Alta", "Crítica"];

export const iconeResposta = (resposta: string | null) =>
  resposta === "Conforme" ? (
    <CheckCircle2 className="size-4 text-success" />
  ) : resposta === "Não conforme" ? (
    <XCircle className="size-4 text-destructive" />
  ) : resposta === "Não se aplica" ? (
    <MinusCircle className="size-4 text-muted-foreground" />
  ) : null;

function NCsDoItem({ itemId }: { itemId: string }) {
  const { data: ncs = [] } = useQuery({
    queryKey: ["ncs-item", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nao_conformidades")
        .select("id, numero, descricao, severidade, status")
        .eq("item_inspecao_id", itemId)
        .order("data_criacao", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  if (ncs.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-sm font-semibold">Não conformidades deste item</p>
      {ncs.map((nc) => (
        <div key={nc.id} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{nc.numero}</span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{nc.descricao}</span>
          <StatusBadge value={nc.severidade} />
          <FotoDialog
            tabela="fotos_nao_conformidade"
            coluna="nao_conformidade_id"
            valor={nc.id}
            titulo={`Fotos adicionais — ${nc.numero}`}
            rotulo="Fotos da NC"
          />
        </div>
      ))}
    </div>
  );
}

function ItemCard({
  item,
  total,
  onMover,
  onExcluir,
  inspecaoId,
  obraId,
}: {
  item: ItemInspecao;
  total: number;
  onMover: (dir: -1 | 1) => void;
  onExcluir: () => void;
  inspecaoId: string;
  obraId: string | null;
}) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [ncAberta, setNcAberta] = useState(false);
  const [local, setLocal] = useState({
    categoria: item.categoria ?? "",
    pergunta: item.pergunta ?? "",
    resposta: item.resposta ?? "",
    observacao: item.observacao ?? "",
  });
  const [ncForm, setNcForm] = useState({
    categoria: item.categoria ?? categoriasChecklist[0] ?? "",
    descricao: item.pergunta ?? "",
    severidade: "Média",
    prazo: "",
    responsavel: "",
    observacao: "",
  });

  const { data: fotos = [] } = useQuery({
    queryKey: ["fotos", "fotos_item_inspecao", item.id],
    queryFn: () => listarFotos("fotos_item_inspecao", "item_inspecao_id", item.id),
  });

  const salvar = useMutation({
    mutationFn: (campos: Partial<ItemInspecao>) => atualizarItem(item.id, campos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itens", inspecaoId] });
      qc.invalidateQueries({ queryKey: ["resumo", inspecaoId] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar item", { description: e.message }),
  });

  const criarNC = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nao_conformidades").insert({
        inspecao_id: inspecaoId,
        item_inspecao_id: item.id,
        obra_id: obraId,
        categoria: ncForm.categoria || null,
        descricao: ncForm.descricao,
        severidade: ncForm.severidade,
        prazo: ncForm.prazo || null,
        responsavel: ncForm.responsavel || null,
        observacao: ncForm.observacao || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ncs-item", item.id] });
      qc.invalidateQueries({ queryKey: ["ncs", inspecaoId] });
      qc.invalidateQueries({ queryKey: ["ncs-todas"] });
      qc.invalidateQueries({ queryKey: ["resumo", inspecaoId] });
      setNcAberta(false);
      toast.success("Não conformidade registrada");
    },
    onError: (e: Error) => toast.error("Erro ao registrar NC", { description: e.message }),
  });

  const rotulo = `Item ${String(item.numero).padStart(2, "0")}`;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <button
            type="button"
            className="min-w-0 text-left"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
          >
            <p className="truncate font-semibold">
              {rotulo}
              {local.categoria ? ` — ${local.categoria}` : ""}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                {iconeResposta(local.resposta)}
                {local.resposta || "Sem resposta"}
              </span>
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="size-4" /> {fotos.length} fotos
              </span>
            </p>
          </button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Mover item para cima"
              disabled={item.ordem === 0}
              onClick={() => onMover(-1)}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Mover item para baixo"
              disabled={item.ordem === total - 1}
              onClick={() => onMover(1)}
            >
              <ChevronDown className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${rotulo}`}
              onClick={onExcluir}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAberto((v) => !v)}
            >
              {aberto ? "Fechar" : "Abrir"}
            </Button>
          </div>
        </div>

        {aberto ? (
          <div className="space-y-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={local.categoria}
                  onValueChange={(v) => {
                    setLocal({ ...local, categoria: v });
                    salvar.mutate({ categoria: v });
                  }}
                >
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Selecione a categoria" />
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
                <Label>Resposta</Label>
                <div className="grid grid-cols-3 gap-2">
                  {RESPOSTAS.map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant={local.resposta === r ? "default" : "outline"}
                      className="h-12 px-2 text-xs sm:text-sm"
                      onClick={() => {
                        setLocal({ ...local, resposta: r });
                        salvar.mutate({ resposta: r, status: statusDaResposta(r) });
                      }}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Pergunta / descrição</Label>
              <Textarea
                rows={2}
                placeholder="O que está sendo verificado neste item?"
                value={local.pergunta}
                onChange={(e) => setLocal({ ...local, pergunta: e.target.value })}
                onBlur={() => salvar.mutate({ pergunta: local.pergunta })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Textarea
                rows={3}
                placeholder="Detalhes observados em campo..."
                value={local.observacao}
                onChange={(e) => setLocal({ ...local, observacao: e.target.value })}
                onBlur={() => salvar.mutate({ observacao: local.observacao })}
              />
            </div>

            {local.resposta === "Não conforme" ? (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  className="h-12 w-full gap-2"
                  onClick={() => setNcAberta(true)}
                >
                  <TriangleAlert className="size-4" /> Registrar não conformidade
                </Button>
                <NCsDoItem itemId={item.id} />
              </div>
            ) : null}

            <div className="rounded-xl border p-3">
              <FotoManager
                tabela="fotos_item_inspecao"
                coluna="item_inspecao_id"
                valor={item.id}
                titulo={`Evidências fotográficas deste item (${rotulo})`}
                rotuloUpload="+ Adicionar fotos"
              />
            </div>
          </div>
        ) : null}

        <Dialog open={ncAberta} onOpenChange={setNcAberta}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Não conformidade — {rotulo}</DialogTitle>
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
                    <SelectValue placeholder="Selecione" />
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
                <Label htmlFor={`nc-desc-${item.id}`}>Descrição</Label>
                <Textarea
                  id={`nc-desc-${item.id}`}
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
                  <Label htmlFor={`nc-prazo-${item.id}`}>Prazo</Label>
                  <Input
                    id={`nc-prazo-${item.id}`}
                    type="date"
                    className="h-12"
                    value={ncForm.prazo}
                    onChange={(e) => setNcForm({ ...ncForm, prazo: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`nc-resp-${item.id}`}>Responsável</Label>
                  <Input
                    id={`nc-resp-${item.id}`}
                    className="h-12"
                    placeholder="Quem deve tratar"
                    value={ncForm.responsavel}
                    onChange={(e) => setNcForm({ ...ncForm, responsavel: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`nc-obs-${item.id}`}>Observação</Label>
                  <Textarea
                    id={`nc-obs-${item.id}`}
                    rows={2}
                    value={ncForm.observacao}
                    onChange={(e) => setNcForm({ ...ncForm, observacao: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                As fotos deste item já servem como evidência. Após salvar, use "Fotos da NC" para
                anexar imagens adicionais.
              </p>
              <DialogFooter>
                <Button type="submit" size="lg" className="h-12 w-full" disabled={criarNC.isPending}>
                  Salvar não conformidade
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export function ItensInspecao({
  inspecaoId,
  obraId,
}: {
  inspecaoId: string;
  obraId: string | null;
}) {
  const qc = useQueryClient();
  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["itens", inspecaoId],
    queryFn: () => listarItens(inspecaoId),
  });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["itens", inspecaoId] });
    qc.invalidateQueries({ queryKey: ["resumo", inspecaoId] });
  };

  const adicionar = useMutation({
    mutationFn: () => criarItem(inspecaoId, itens.length, itens.length + 1),
    onSuccess: invalidar,
    onError: (e: Error) => toast.error("Erro ao adicionar item", { description: e.message }),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      await excluirItem(id);
      await reordenarItens(itens.filter((i) => i.id !== id));
    },
    onSuccess: () => {
      invalidar();
      toast.success("Item excluído");
    },
    onError: (e: Error) => toast.error("Erro ao excluir item", { description: e.message }),
  });

  const mover = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const destino = index + dir;
      if (destino < 0 || destino >= itens.length) return;
      const novos = [...itens];
      const [movido] = novos.splice(index, 1);
      novos.splice(destino, 0, movido);
      await reordenarItens(novos);
    },
    onSuccess: invalidar,
    onError: (e: Error) => toast.error("Erro ao reordenar", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando itens...</p> : null}

      {!isLoading && itens.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum item adicionado. Use "+ Adicionar item" para incluir quantos itens forem
          necessários.
        </p>
      ) : null}

      {itens.map((item, index) => (
        <ItemCard
          key={item.id}
          item={item}
          total={itens.length}
          inspecaoId={inspecaoId}
          obraId={obraId}
          onMover={(dir) => mover.mutate({ index, dir })}
          onExcluir={() => remover.mutate(item.id)}
        />
      ))}

      <Button
        type="button"
        size="lg"
        variant="outline"
        className="h-14 w-full gap-2 text-base"
        disabled={adicionar.isPending}
        onClick={() => adicionar.mutate()}
      >
        <Plus className="size-5" /> Adicionar item
      </Button>
    </div>
  );
}
