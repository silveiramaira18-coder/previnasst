import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Layers,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FotoManager } from "@/components/FotoManager";
import { MultiSelectNR } from "@/components/MultiSelectNR";
import { ResponsaveisInput } from "@/components/ResponsaveisInput";
import { SelectPesquisavel } from "@/components/SelectPesquisavel";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { emailsDosResponsaveis, hojeISO, statusExibidoNC, type NaoConformidade } from "@/lib/db";
import { listarFotos } from "@/lib/fotos";
import {
  atualizarItem,
  criarItem,
  excluirItem,
  listarItens,
  normasDoItem,
  reordenarItens,
  RESPOSTAS,
  statusDaResposta,
  type ItemInspecao,
} from "@/lib/itens";
import { CATEGORIAS_NC, RISCOS_POTENCIAIS } from "@/lib/opcoes";
import { carregarPavimentos } from "@/lib/pavimentos";

const SEVERIDADES = ["Crítico", "Médio", "Baixo"];
const SEM_PAVIMENTO = "__sem__";

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
        .select("*")
        .eq("item_inspecao_id", itemId)
        .order("data_criacao", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as NaoConformidade[];
    },
  });
}

/** Status gravado na NC conforme o fluxo em 2 etapas. */
const statusNC = (acaoImediata: boolean, atual?: string) => {
  if (atual === "Concluída") return "Concluída";
  return acaoImediata ? "Em andamento" : "Aberta";
};

/* ------------------------------------------------------------------ */
/* Formulário de NC (criação e edição com todos os campos carregados)  */
/* ------------------------------------------------------------------ */

function FormularioNC({
  item,
  nc,
  inspecaoId,
  obraId,
  fotosItem,
  rotulo,
  onCriada,
}: {
  item: ItemInspecao;
  nc: NaoConformidade | null;
  inspecaoId: string;
  obraId: string | null;
  fotosItem: number;
  rotulo: string;
  onCriada: (acaoImediata: boolean) => void;
}) {
  const qc = useQueryClient();
  const hoje = hojeISO();
  const [erroFotos, setErroFotos] = useState(false);
  const [form, setForm] = useState({
    categoria: nc?.categoria ?? item.categoria ?? "",
    normas: normasDoItem(item),
    risco: item.risco_potencial ?? "",
    descricao: nc?.descricao ?? "",
    severidade: nc?.severidade ?? "Médio",
    prazo: nc?.prazo ?? "",
    responsaveis:
      nc?.responsaveis && nc.responsaveis.length > 0
        ? nc.responsaveis
        : nc?.responsavel
          ? [nc.responsavel]
          : [],
    observacao: nc?.observacao ?? "",
    acaoImediata: !!nc?.acao_imediata,
    descricaoAcaoImediata: nc?.descricao_acao_imediata ?? "",
  });

  useEffect(() => {
    if (fotosItem > 0) setErroFotos(false);
  }, [fotosItem]);

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        inspecao_id: inspecaoId,
        item_inspecao_id: item.id,
        obra_id: obraId,
        categoria: form.categoria || null,
        descricao: form.descricao,
        severidade: form.severidade,
        prazo: form.prazo || null,
        responsaveis: form.responsaveis,
        responsavel: form.responsaveis.join(", ") || null,
        emails_responsaveis: emailsDosResponsaveis(form.responsaveis),
        observacao: form.observacao || null,
        acao_imediata: form.acaoImediata,
        descricao_acao_imediata: form.acaoImediata ? form.descricaoAcaoImediata || null : null,
        data_acao_imediata: form.acaoImediata ? (nc?.data_acao_imediata ?? hoje) : null,
        status: statusNC(form.acaoImediata, nc?.status),
      };
      if (nc) {
        const { error } = await supabase.from("nao_conformidades").update(payload).eq("id", nc.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("nao_conformidades").insert(payload);
        if (error) throw new Error(error.message);
      }
      await atualizarItem(item.id, {
        status: "Não conforme",
        categoria: form.categoria || null,
        normas_regulamentadoras: form.normas,
        norma_regulamentadora: form.normas[0] ?? null,
        risco_potencial: form.risco || null,
      });
      return !nc;
    },
    onSuccess: (criada) => {
      qc.invalidateQueries({ queryKey: ["indicadores"] });
      qc.invalidateQueries({ queryKey: ["ncs-item", item.id] });
      qc.invalidateQueries({ queryKey: ["ncs", inspecaoId] });
      qc.invalidateQueries({ queryKey: ["ncs-todas"] });
      qc.invalidateQueries({ queryKey: ["itens", inspecaoId] });
      qc.invalidateQueries({ queryKey: ["resumo", inspecaoId] });
      if (criada) {
        toast.success("Não conformidade registrada");
        onCriada(form.acaoImediata);
      } else {
        toast.success("Alterações salvas");
      }
    },
    onError: (e: Error) => toast.error("Erro ao salvar NC", { description: e.message }),
  });

  return (
    <form
      className="space-y-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (fotosItem === 0) {
          setErroFotos(true);
          toast.error("Adicione ao menos uma foto antes de prosseguir.");
          return;
        }
        setErroFotos(false);
        salvar.mutate();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">
          Não conformidade — {rotulo}
          {nc ? ` · ${nc.numero}` : ""}
        </p>
        {nc ? <StatusBadge value={statusExibidoNC(nc)} /> : null}
      </div>

      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <SelectPesquisavel
          opcoes={CATEGORIAS_NC}
          value={form.categoria}
          onChange={(v) => setForm({ ...form, categoria: v })}
          placeholder="Selecione a categoria..."
          placeholderOutro="Informe a categoria"
        />
      </div>

      <div className="space-y-1.5">
        <Label>NR relacionada</Label>
        <MultiSelectNR value={form.normas} onChange={(v) => setForm({ ...form, normas: v })} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`nc-desc-${item.id}`}>Não conformidade encontrada</Label>
        <Textarea
          id={`nc-desc-${item.id}`}
          required
          rows={3}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />
      </div>

      <div className="space-y-1.5 rounded-xl border border-warning/40 bg-warning/10 p-3">
        <Label>Risco potencial</Label>
        <p className="text-xs text-muted-foreground">
          Consequência possível caso a não conformidade não seja corrigida.
        </p>
        <SelectPesquisavel
          opcoes={RISCOS_POTENCIAIS}
          value={form.risco}
          onChange={(v) => setForm({ ...form, risco: v })}
          placeholder="Selecione o risco potencial..."
          placeholderOutro="Descreva o risco potencial"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Grau de severidade / risco</Label>
          <Select value={form.severidade} onValueChange={(v) => setForm({ ...form, severidade: v })}>
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
          <Label htmlFor={`nc-prazo-${item.id}`}>Prazo para conclusão</Label>
          <input
            id={`nc-prazo-${item.id}`}
            type="date"
            className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.prazo}
            onChange={(e) => setForm({ ...form, prazo: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Responsável por resolver a não conformidade</Label>
        <ResponsaveisInput
          value={form.responsaveis}
          onChange={(v) => setForm({ ...form, responsaveis: v })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`nc-obs-${item.id}`}>Medida de correção definitiva</Label>
        <Textarea
          id={`nc-obs-${item.id}`}
          required
          rows={2}
          placeholder="Ex.: Enviar funcionário novamente para treinamento da NR-35"
          value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })}
        />
      </div>

      <div className="space-y-3 rounded-xl border bg-background p-3">
        <div className="flex items-start gap-3">
          <Switch
            id={`nc-acao-${item.id}`}
            checked={form.acaoImediata}
            onCheckedChange={(v) => setForm({ ...form, acaoImediata: v })}
          />
          <div className="space-y-0.5">
            <Label htmlFor={`nc-acao-${item.id}`}>
              Ação Imediata / Intervenção no Local Realizada?
            </Label>
            <p className="text-xs text-muted-foreground">
              Ação imediata concluída no local (risco sanado). A NC ficará marcada como
              "Parcialmente Concluída" até a realização e baixa da medida definitiva (ex.:
              treinamento) no painel de Não Conformidades.
            </p>
          </div>
        </div>
        {form.acaoImediata ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`nc-acao-desc-${item.id}`}>Descrição da Ação Imediata</Label>
              <Textarea
                id={`nc-acao-desc-${item.id}`}
                required
                rows={2}
                placeholder="Ex.: Paralisação da atividade e adequação do uso do cinto de segurança no local"
                value={form.descricaoAcaoImediata}
                onChange={(e) => setForm({ ...form, descricaoAcaoImediata: e.target.value })}
              />
            </div>
            {nc ? (
              <FotoManager
                tabela="fotos_nao_conformidade"
                coluna="nao_conformidade_id"
                valor={nc.id}
                titulo="Evidência Fotográfica da Ação Imediata"
                rotuloUpload="+ Adicionar evidência"
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                Após salvar, você poderá anexar a evidência fotográfica da ação imediata.
              </p>
            )}
          </div>
        ) : null}
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

      <Button type="submit" size="lg" className="h-12 w-full" disabled={salvar.isPending}>
        {nc ? "Salvar alterações" : "Salvar NC e ir para o próximo item"}
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Card do item                                                        */
/* ------------------------------------------------------------------ */

function ItemCard({
  item,
  total,
  onMover,
  onExcluir,
  inspecaoId,
  obraId,
  pavimentos,
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
  pavimentos: string[];
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

  const { data: fotos = [] } = useQuery({
    queryKey: ["fotos", "fotos_item_inspecao", item.id],
    queryFn: () => listarFotos("fotos_item_inspecao", "item_inspecao_id", item.id),
  });

  const { data: ncs = [], isLoading: carregandoNCs } = useNCsDoItem(item.id);
  const nc = ncs[0] ?? null;

  const salvar = useMutation({
    mutationFn: (campos: Partial<ItemInspecao>) => atualizarItem(item.id, campos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itens", inspecaoId] });
      qc.invalidateQueries({ queryKey: ["resumo", inspecaoId] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar item", { description: e.message }),
  });

  const rotulo = `Item ${String(item.numero).padStart(2, "0")}`;
  const normas = normasDoItem(item);
  const opcoesPavimento =
    local.local && !pavimentos.includes(local.local) ? [local.local, ...pavimentos] : pavimentos;

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
            {normas.length > 0 ? (
              <span className="mt-1 flex flex-wrap gap-1">
                {normas.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center rounded-lg border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {n}
                  </span>
                ))}
              </span>
            ) : null}
            {nc ? (
              <span className="mt-1 flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                  <TriangleAlert className="size-3.5" /> {nc.numero} · {statusExibidoNC(nc)}
                </span>
                {nc.acao_imediata && nc.status !== "Concluída" ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-info/10 px-2 py-1 text-xs font-medium text-info">
                    <ShieldCheck className="size-3.5" /> Risco imediato sanado
                  </span>
                ) : null}
              </span>
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
                onClick={onAlternar}
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
                <Label>Pavimento / Tipo</Label>
                <Select
                  value={local.local || SEM_PAVIMENTO}
                  onValueChange={(v) => {
                    const valor = v === SEM_PAVIMENTO ? "" : v;
                    setLocal({ ...local, local: valor });
                    salvar.mutate({ local: valor || null });
                  }}
                >
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Selecione o pavimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_PAVIMENTO}>Não informado</SelectItem>
                    {opcoesPavimento.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {local.resposta === "Não conforme" && !carregandoNCs ? (
              <FormularioNC
                key={nc?.id ?? "nova"}
                item={item}
                nc={nc}
                inspecaoId={inspecaoId}
                obraId={obraId}
                fotosItem={fotos.length}
                rotulo={rotulo}
                onCriada={(acaoImediata) => {
                  if (acaoImediata) {
                    toast.info("Anexe a evidência fotográfica da ação imediata, se houver.");
                  } else {
                    onConcluir();
                  }
                }}
              />
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

/* ------------------------------------------------------------------ */
/* Lista agrupada por Pavimento/Tipo                                    */
/* ------------------------------------------------------------------ */

export function ItensInspecao({
  inspecaoId,
  obraId,
}: {
  inspecaoId: string;
  obraId: string | null;
}) {
  const qc = useQueryClient();
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [pavimentoAtual, setPavimentoAtual] = useState<string>("");

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["itens", inspecaoId],
    queryFn: () => listarItens(inspecaoId),
  });

  const { data: pavimentosObra = [] } = useQuery({
    queryKey: ["pavimentos", obraId],
    queryFn: () => carregarPavimentos(obraId as string),
    enabled: !!obraId,
  });
  const pavimentos = pavimentosObra.map((p) => p.nome);

  // Define o pavimento atual a partir do último item registrado (ou do primeiro da lista).
  useEffect(() => {
    if (pavimentoAtual) return;
    const ultimo = [...itens].reverse().find((i) => i.local)?.local;
    if (ultimo) setPavimentoAtual(ultimo);
    else if (pavimentos[0]) setPavimentoAtual(pavimentos[0]);
  }, [itens, pavimentos, pavimentoAtual]);

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
    mutationFn: () => criarItem(inspecaoId, itens.length, itens.length + 1, pavimentoAtual),
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

  const opcoesPavimento =
    pavimentoAtual && !pavimentos.includes(pavimentoAtual)
      ? [pavimentoAtual, ...pavimentos]
      : pavimentos;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 rounded-xl border bg-muted/40 p-3">
        <Label className="inline-flex items-center gap-1">
          <Layers className="size-4" /> Pavimento / Tipo atual
        </Label>
        <Select value={pavimentoAtual || SEM_PAVIMENTO} onValueChange={(v) => setPavimentoAtual(v === SEM_PAVIMENTO ? "" : v)}>
          <SelectTrigger className="h-12 w-full bg-background">
            <SelectValue placeholder="Selecione o pavimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SEM_PAVIMENTO}>Não informado</SelectItem>
            {opcoesPavimento.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Selecione uma vez e registre quantos itens quiser neste pavimento. Os pavimentos são
          gerenciados na tela "Obras".
        </p>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando itens...</p> : null}

      {!isLoading && itens.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum item adicionado. Use "+ Adicionar item" para incluir quantos itens forem
          necessários.
        </p>
      ) : null}

      {itens.map((item, index) => {
        const anterior = itens[index - 1];
        const novoGrupo = index === 0 || (anterior?.local ?? "") !== (item.local ?? "");
        return (
          <div key={item.id} className="space-y-3">
            {novoGrupo ? (
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pavimento/Tipo: {item.local || "Não informado"}
              </p>
            ) : null}
            <ItemCard
              item={item}
              total={itens.length}
              inspecaoId={inspecaoId}
              obraId={obraId}
              pavimentos={pavimentos}
              aberto={abertoId === item.id}
              onAlternar={() => setAbertoId((v) => (v === item.id ? null : item.id))}
              onConcluir={() => irParaProximo(index)}
              onMover={(dir) => mover.mutate({ index, dir })}
              onExcluir={() => remover.mutate(item.id)}
            />
          </div>
        );
      })}

      <Button
        type="button"
        size="lg"
        variant="outline"
        className="h-14 w-full gap-2 text-base"
        disabled={adicionar.isPending}
        onClick={() => adicionar.mutate()}
      >
        <Plus className="size-5" />
        {pavimentoAtual ? `Adicionar item em ${pavimentoAtual}` : "Adicionar item"}
      </Button>
    </div>
  );
}
