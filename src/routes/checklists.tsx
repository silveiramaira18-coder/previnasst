import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RequerPermissao } from "@/components/RequerPermissao";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { listarChecklists, type Checklist } from "@/lib/db";
import { categoriasChecklist } from "@/lib/mock-data";

export const Route = createFileRoute("/checklists")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Lista de Verificação — Previna SST" },
      {
        name: "description",
        content:
          "Área administrativa para criar e organizar as listas de verificação usadas nas inspeções do Previna SST.",
      },
      { property: "og:title", content: "Lista de Verificação — Previna SST" },
      {
        property: "og:description",
        content: "Gestão administrativa das listas de verificação de segurança do trabalho.",
      },
    ],
  }),
  component: ChecklistsPageProtegido,
});

type ItemChecklist = {
  id: string;
  checklist_id: string;
  pergunta: string;
  categoria: string | null;
  ordem: number;
  ativo: boolean;
};

function ItensDoChecklist({ checklistId }: { checklistId: string }) {
  const qc = useQueryClient();
  const [pergunta, setPergunta] = useState("");
  const [categoria, setCategoria] = useState("");

  const { data: itens = [] } = useQuery({
    queryKey: ["itens-checklist", checklistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itens_checklist")
        .select("*")
        .eq("checklist_id", checklistId)
        .order("ordem", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as ItemChecklist[];
    },
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["itens-checklist", checklistId] });

  const adicionar = useMutation({
    mutationFn: async () => {
      if (!pergunta.trim()) throw new Error("Informe a pergunta do item.");
      const { error } = await supabase.from("itens_checklist").insert({
        checklist_id: checklistId,
        pergunta: pergunta.trim(),
        categoria: categoria || null,
        ordem: itens.length,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setPergunta("");
      invalidar();
      toast.success("Item adicionado");
    },
    onError: (e: Error) => toast.error("Erro ao adicionar item", { description: e.message }),
  });

  const alternar = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("itens_checklist").update({ ativo }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidar,
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("itens_checklist").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidar();
      toast.success("Item excluído");
    },
  });

  return (
    <div className="space-y-3 border-t pt-3">
      {itens.map((i) => (
        <div key={i.id} className="flex items-start gap-2 rounded-lg border p-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm">{i.pergunta}</p>
            {i.categoria ? (
              <p className="text-xs text-muted-foreground">{i.categoria}</p>
            ) : null}
          </div>
          <Switch
            checked={i.ativo}
            aria-label="Ativar item"
            onCheckedChange={(v) => alternar.mutate({ id: i.id, ativo: v })}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir item"
            onClick={() => remover.mutate(i.id)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          className="h-11"
          placeholder="Nova pergunta de verificação"
          value={pergunta}
          maxLength={240}
          onChange={(e) => setPergunta(e.target.value)}
        />
        <Button
          variant="outline"
          className="h-11 gap-1"
          disabled={adicionar.isPending}
          onClick={() => adicionar.mutate()}
        >
          <Plus className="size-4" /> Adicionar item
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {categoriasChecklist.map((c) => (
          <button key={c} type="button" onClick={() => setCategoria(c)}>
            <Badge
              variant={categoria === c ? "default" : "secondary"}
              className="rounded-full px-3 py-1 text-xs"
            >
              {c}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChecklistsPage() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "", categoria: "" });

  const { data: listas = [], isLoading } = useQuery({
    queryKey: ["checklists"],
    queryFn: listarChecklists,
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("checklists").insert({
        nome: form.nome,
        descricao: form.descricao || null,
        categoria: form.categoria || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklists"] });
      setAberto(false);
      setForm({ nome: "", descricao: "", categoria: "" });
      toast.success("Lista de verificação criada");
    },
    onError: (e: Error) => toast.error("Erro ao criar", { description: e.message }),
  });

  const alternarAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("checklists").update({ ativo }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklists").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklists"] });
      toast.success("Lista excluída");
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lista de Verificação"
        description="Área exclusiva da administradora para criar e organizar os modelos usados nas inspeções."
        action={
          <Button size="lg" className="gap-2" onClick={() => setAberto(true)}>
            <Plus className="size-4" /> Nova lista
          </Button>
        }
      />

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova lista de verificação</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              criar.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="cl-nome">Nome</Label>
              <Input
                id="cl-nome"
                required
                className="h-12"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-cat">Categoria</Label>
              <Input
                id="cl-cat"
                className="h-12"
                placeholder="Ex.: Trabalho em altura"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-desc">Descrição</Label>
              <Textarea
                id="cl-desc"
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" size="lg" className="h-12 w-full" disabled={criar.isPending}>
                Salvar lista
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando listas...</p> : null}
      {!isLoading && listas.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma lista de verificação cadastrada. Use "Nova lista" para criar a primeira.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {listas.map((cl: Checklist) => (
          <Card key={cl.id} className="h-full">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <ListChecks className="size-4 shrink-0 text-primary" />
                  <p className="truncate font-semibold">{cl.nome}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cl.ativo}
                    aria-label="Ativar lista"
                    onCheckedChange={(v) => alternarAtivo.mutate({ id: cl.id, ativo: v })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${cl.nome}`}
                    onClick={() => excluir.mutate(cl.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {cl.categoria ? (
                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs">
                  {cl.categoria}
                </Badge>
              ) : null}
              {cl.descricao ? (
                <p className="text-sm text-muted-foreground">{cl.descricao}</p>
              ) : null}
              <ItensDoChecklist checklistId={cl.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ChecklistsPageProtegido() {
  return (
    <RequerPermissao permissao="gerenciarChecklists">
      <ChecklistsPage />
    </RequerPermissao>
  );
}
