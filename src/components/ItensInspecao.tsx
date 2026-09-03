import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FotoDialog } from "@/components/FotoDialog";
import { FotoManager } from "@/components/FotoManager";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  NORMAS_COMUNS,
  RESPOSTAS,
  statusDaResposta,
  type ItemInspecao,
} from "@/lib/itens";


const SEVERIDADES = ["Crítico", "Médio", "Baixo"];

export const iconeResposta = (resposta: string | null) =>
  resposta === "Conforme" ? (
    <CheckCircle2 className="size-4 text-success" />
  ) : resposta === "Não conforme" ? (
    <XCircle className="size-4 text-destructive" />
  ) : null;

function useNCsDoItem(itemId: string) {
  return useQuery({
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
}

function NCsDoItem({ ncs }: { ncs: { id: string; numero: string; descricao: string; severidade: string }[] }) {
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
  aberto,
  onAlternar,
  onConcluir,
}: {
  item: ItemInspecao;
  total: number;
  onMover: (dir: -1 | 1) => void;
  onExcluir: () => void;
  inspecaoId: string;
  obraId: string | null;
  aberto: boolean;
  onAlternar: () => void;
  onConcluir: () => void;
}) {
  const qc = useQueryClient();
  const [local, setLocal] = useState({
    local: item.local ?? "",
    resposta: item.resposta ?? "",
    observacao: item.observacao ?? "",
  });
  const [modoEdicao, setModoEdicao] = useState(false);
  const [ncForm, setNcForm] = useState({
    categoria: item.categoria ?? "",
    norma: item.norma_regulamentadora ?? "",
    risco: item.risco_potencial ?? "",
    descricao: "",
    severidade: "Médio",
    prazo: "",
    responsavel: "",
    observacao: "",
  });
  const [erroFotos, setErroFotos] = useState(false);

  const { data: fotos = [] } = useQuery({
    queryKey: ["fotos", "fotos_item_inspecao", item.id],
    queryFn: () => listarFotos("fotos_item_inspecao", "item_inspecao_id", item.id),
  });

  const { data: ncs = [] } = useNCsDoItem(item.id);

  useEffect(() => {
    if (fotos.length > 0) setErroFotos(false);
  }, [fotos.length]);

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
      await atualizarItem(item.id, {
        status: "Não conforme",
        categoria: ncForm.categoria || null,
        norma_regulamentadora: ncForm.norma || null,
        risco_potencial: ncForm.risco || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ncs-item", item.id] });
      qc.invalidateQueries({ queryKey: ["ncs", inspecaoId] });
      qc.invalidateQueries({ queryKey: ["ncs-todas"] });
      qc.invalidateQueries({ queryKey: ["itens", inspecaoId] });
      qc.invalidateQueries({ queryKey: ["resumo", inspecaoId] });
      toast.success("Não conformidade registrada");
      onConcluir();
    },
    onError: (e: Error) => toast.error("Erro ao registrar NC", { description: e.message }),
  });

  const rotulo = `Item ${String(item.numero).padStart(2, "0")}`;

  return (
    <Card id={`item-${item.id}`} className="scroll-mt-24">
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <button type="button" className="min-w-0 text-left" onClick={onAlternar} aria-expanded={aberto}>
            <p className="truncate font-semibold">
              {rotulo}
              {item.categoria ? ` — ${item.categoria}` : ""}
            </p>
            {local.local ? (
              <p className="truncate text-xs text-muted-foreground">{local.local}</p>
            ) : null}
            <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                {iconeResposta(local.resposta)}
                {local.resposta || "Sem resposta"}
              </span>
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="size-4" /> {fotos.length} fotos
              </span>
            </p>
            {item.norma_regulamentadora ? (
              <span className="mt-1 mr-2 inline-flex items-center rounded-lg border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {item.norma_regulamentadora}
              </span>
            ) : null}
            {ncs.length > 0 ? (
              <p className="mt-1 inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                <TriangleAlert className="size-3.5" /> NC registrada com {fotos.length} fotos
              </p>
            ) : null}
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
            {aberto ? (
              <Button type="button" variant="outline" size="sm" onClick={onAlternar}>
                Fechar
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Editar ${rotulo}`}
                onClick={() => {
                  setModoEdicao(true);
                  onAlternar();
                }}
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {aberto ? (
          <div className="space-y-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Resposta</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RESPOSTAS.filter((r) => r !== "Não se aplica").map((r) => (
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
              <div className="space-y-1.5">
                <Label htmlFor={`item-local-${item.id}`}>Local / setor</Label>
                <Input
                  id={`item-local-${item.id}`}
                  className="h-12"
                  placeholder="Ex.: Torre B — 7º pavimento"
                  value={local.local}
                  onChange={(e) => setLocal({ ...local, local: e.target.value })}
                  onBlur={() => salvar.mutate({ local: local.local })}
                />
              </div>
            </div>

            {local.resposta === "Conforme" ? (
              <div className="space-y-1.5">
                <Label htmlFor={`item-obs-${item.id}`}>Descrição / Observação (opcional)</Label>
                <Textarea
                  id={`item-obs-${item.id}`}
                  rows={3}
                  placeholder="Descrição / Observação (opcional)"
                  value={local.observacao}
                  onChange={(e) => setLocal({ ...local, observacao: e.target.value })}
                  onBlur={() => salvar.mutate({ observacao: local.observacao || null })}
                />
              </div>
            ) : null}

            {local.resposta === "Não conforme" ? (
              <div className="space-y-3">
                {ncs.length > 0 ? (
                  <NCsDoItem ncs={ncs} />
                ) : (
                  <form
                    className="space-y-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (fotos.length === 0) {
                        setErroFotos(true);
                        toast.error("Adicione ao menos uma foto antes de prosseguir.");
                        return;
                      }
                      setErroFotos(false);
                      criarNC.mutate();
                    }}
                  >
                    <p className="font-semibold">Não conformidade — {rotulo}</p>
                    <div className="space-y-1.5">
                      <Label htmlFor={`nc-cat-${item.id}`}>Categoria</Label>
                      <Input
                        id={`nc-cat-${item.id}`}
                        className="h-12"
                        placeholder="Ex.: Trabalho em altura, EPI..."
                        value={ncForm.categoria}
                        onChange={(e) => setNcForm({ ...ncForm, categoria: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`nc-nr-${item.id}`}>NR relacionada</Label>
                      <Input
                        id={`nc-nr-${item.id}`}
                        className="h-12"
                        list={`nrs-${item.id}`}
                        placeholder="Ex.: NR-35"
                        value={ncForm.norma}
                        onChange={(e) => setNcForm({ ...ncForm, norma: e.target.value })}
                      />
                      <datalist id={`nrs-${item.id}`}>
                        {NORMAS_COMUNS.map((n) => (
                          <option key={n} value={n} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`nc-desc-${item.id}`}>Não conformidade encontrada</Label>
                      <Textarea
                        id={`nc-desc-${item.id}`}
                        required
                        rows={3}
                        value={ncForm.descricao}
                        onChange={(e) => setNcForm({ ...ncForm, descricao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-warning/40 bg-warning/10 p-3">
                      <Label htmlFor={`nc-risco-${item.id}`}>Risco potencial</Label>
                      <p className="text-xs text-muted-foreground">
                        Consequência possível caso a não conformidade não seja corrigida.
                      </p>
                      <Textarea
                        id={`nc-risco-${item.id}`}
                        rows={2}
                        placeholder="Ex.: Queda de altura com risco de lesão grave ou óbito"
                        value={ncForm.risco}
                        onChange={(e) => setNcForm({ ...ncForm, risco: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Grau de severidade / risco</Label>
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
                        <Label htmlFor={`nc-prazo-${item.id}`}>Data para correção</Label>
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
                          required
                          placeholder="Pessoa ou equipe responsável pela correção"
                          value={ncForm.responsavel}
                          onChange={(e) => setNcForm({ ...ncForm, responsavel: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`nc-obs-${item.id}`}>Medida de correção</Label>
                        <Textarea
                          id={`nc-obs-${item.id}`}
                          required
                          rows={2}
                          placeholder="Ação corretiva necessária"
                          value={ncForm.observacao}
                          onChange={(e) => setNcForm({ ...ncForm, observacao: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-background p-3">
                      <FotoManager
                        tabela="fotos_item_inspecao"
                        coluna="item_inspecao_id"
                        valor={item.id}
                        titulo="Fotos da não conformidade"
                        rotuloUpload="+ Adicionar fotos"
                      />
                      {erroFotos ? (
                        <p className="mt-2 text-sm font-medium text-destructive">
                          É obrigatório anexar pelo menos 1 foto para registrar a Não Conformidade.
                        </p>
                      ) : null}
                    </div>

                    <Button type="submit" size="lg" className="h-12 w-full" disabled={criarNC.isPending}>
                      Salvar NC e ir para o próximo item
                    </Button>
                  </form>
                )}
              </div>
            ) : null}

            {local.resposta !== "Não conforme" ? (
              <div className="rounded-xl border p-3">
                <FotoManager
                  tabela="fotos_item_inspecao"
                  coluna="item_inspecao_id"
                  valor={item.id}
                  titulo={`Evidências fotográficas deste item (${rotulo})`}
                  rotuloUpload="+ Adicionar fotos"
                />
              </div>
            ) : null}
          </div>
        ) : null}
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
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["itens", inspecaoId],
    queryFn: () => listarItens(inspecaoId),
  });

  const irParaProximo = (index: number) => {
    const proximo = itens[index + 1];
    setAbertoId(proximo ? proximo.id : null);
    if (proximo) {
      setTimeout(() => {
        document
          .getElementById(`item-${proximo.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  };


  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["itens", inspecaoId] });
    qc.invalidateQueries({ queryKey: ["resumo", inspecaoId] });
  };

  const adicionar = useMutation({
    mutationFn: () => criarItem(inspecaoId, itens.length, itens.length + 1),
    onSuccess: (novo) => {
      invalidar();
      setAbertoId(novo.id);
    },

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
      if (!movido) return;
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
          aberto={abertoId === item.id}
          onAlternar={() => setAbertoId((v) => (v === item.id ? null : item.id))}
          onConcluir={() => irParaProximo(index)}
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
