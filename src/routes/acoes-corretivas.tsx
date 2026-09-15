import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FotoDialog } from "@/components/FotoDialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, listarAcoes, listarNCs } from "@/lib/db";

type BuscaAcoes = { status?: "atrasadas" };

export const Route = createFileRoute("/acoes-corretivas")({
  validateSearch: (search: Record<string, unknown>): BuscaAcoes =>
    search["status"] === "atrasadas" ? { status: "atrasadas" } : {},
  head: () => ({
    meta: [
      { title: "Ações Corretivas — Previna SST" },
      {
        name: "description",
        content:
          "Controle das tratativas de não conformidades: responsável, prazo, status e evidências de conclusão.",
      },
      { property: "og:title", content: "Ações Corretivas — Previna SST" },
      {
        property: "og:description",
        content: "Acompanhe as tratativas das não conformidades de segurança do trabalho.",
      },
    ],
  }),
  component: AcoesPage,
});

const STATUS = ["Aberta", "Em andamento", "Atrasada", "Concluída"];

function AcoesPage() {
  const qc = useQueryClient();
  const busca = Route.useSearch();
  const [filtro, setFiltro] = useState<"todas" | "atrasadas">(
    busca.status === "atrasadas" ? "atrasadas" : "todas",
  );
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    nao_conformidade_id: "",
    descricao: "",
    responsavel: "",
    prazo: "",
    status: "Aberta",
    observacao: "",
  });

  const { data: acoes = [], isLoading } = useQuery({ queryKey: ["acoes"], queryFn: listarAcoes });
  const { data: ncs = [] } = useQuery({ queryKey: ["ncs-todas"], queryFn: listarNCs });

  const pendentes = ncs.filter((n) => n.status !== "Concluída");
  const atrasadas = pendentes.filter((n) => ncVencida(n));
  const ncsVisiveis = filtro === "atrasadas" ? atrasadas : pendentes;

  const criar = useMutation({
    mutationFn: async () => {
      if (!form.nao_conformidade_id) throw new Error("Selecione a não conformidade.");
      const { error } = await supabase.from("acoes_corretivas").insert({
        nao_conformidade_id: form.nao_conformidade_id,
        descricao: form.descricao,
        responsavel: form.responsavel || null,
        prazo: form.prazo || null,
        status: form.status,
        observacao: form.observacao || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acoes"] });
      setAberto(false);
      setForm({ ...form, descricao: "", responsavel: "", prazo: "", observacao: "" });
      toast.success("Ação corretiva criada");
    },
    onError: (e: Error) => toast.error("Erro ao criar ação", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ações Corretivas"
        description="Tratativas definidas para eliminar as não conformidades."
        action={
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="size-4" /> Nova Ação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova ação corretiva</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  criar.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label>Não conformidade</Label>
                  <Select
                    value={form.nao_conformidade_id}
                    onValueChange={(v) => setForm({ ...form, nao_conformidade_id: v })}
                  >
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Selecione a NC" />
                    </SelectTrigger>
                    <SelectContent>
                      {ncs.map((nc) => (
                        <SelectItem key={nc.id} value={nc.id}>
                          {nc.numero} — {nc.descricao.slice(0, 40)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acao">Descrição da ação</Label>
                  <Textarea
                    id="acao"
                    required
                    rows={3}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="resp">Responsável</Label>
                    <Input
                      id="resp"
                      className="h-12"
                      value={form.responsavel}
                      onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pz">Prazo</Label>
                    <Input
                      id="pz"
                      type="date"
                      className="h-12"
                      value={form.prazo}
                      onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" size="lg" className="h-12 w-full" disabled={criar.isPending}>
                    Criar ação corretiva
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filtro === "todas" ? "default" : "outline"}
          size="lg"
          className="h-11"
          onClick={() => setFiltro("todas")}
        >
          Todas as pendências ({pendentes.length})
        </Button>
        <Button
          variant={filtro === "atrasadas" ? "default" : "outline"}
          size="lg"
          className="h-11"
          onClick={() => setFiltro("atrasadas")}
        >
          Atrasadas ({atrasadas.length})
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="font-semibold">
            {filtro === "atrasadas"
              ? "Não conformidades com prazo vencido"
              : "Não conformidades pendentes de tratativa"}
          </p>
          {ncsVisiveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {filtro === "atrasadas"
                ? "Nenhuma não conformidade com prazo vencido."
                : "Nenhuma não conformidade pendente."}
            </p>
          ) : null}
          {ncsVisiveis.map((nc) => (
            <div key={nc.id} className="space-y-2 rounded-xl border p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="truncate font-semibold">
                  {nc.numero} · {nc.inspecoes?.obras?.nome ?? "Obra não informada"}
                </p>
                <StatusBadge value={statusExibidoNC(nc)} />
              </div>
              <p className="text-sm text-muted-foreground">{nc.descricao}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <PrazoBadge nc={nc} />
                <span className="text-muted-foreground">
                  Prazo: {formatarData(nc.prazo)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
      {!isLoading && acoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma ação corretiva cadastrada ainda.</p>
      ) : null}

      {acoes.length > 0 ? (
        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>NC</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Evidências</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acoes.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.numero}</TableCell>
                    <TableCell>{a.nao_conformidades?.numero ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {a.descricao}
                    </TableCell>
                    <TableCell>{a.responsavel ?? "—"}</TableCell>
                    <TableCell>{formatarData(a.prazo)}</TableCell>
                    <TableCell>
                      <StatusBadge value={a.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <FotoDialog
                        tabela="fotos_acao_corretiva"
                        coluna="acao_corretiva_id"
                        valor={a.id}
                        titulo={`Fotos da ação ${a.numero}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:hidden">
        {acoes.map((a) => (
          <Card key={a.id}>
            <CardContent className="space-y-2 p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="truncate font-semibold">
                  {a.numero} · {a.nao_conformidades?.numero ?? "—"}
                </p>
                <StatusBadge value={a.status} />
              </div>
              <p className="text-sm text-muted-foreground">{a.descricao}</p>
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span>{a.responsavel ?? "—"}</span>
                <span className="text-muted-foreground">Prazo: {formatarData(a.prazo)}</span>
              </div>
              <FotoDialog
                tabela="fotos_acao_corretiva"
                coluna="acao_corretiva_id"
                valor={a.id}
                titulo={`Fotos da ação ${a.numero}`}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
