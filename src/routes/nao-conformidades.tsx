import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FotoDialog } from "@/components/FotoDialog";
import { PageHeader } from "@/components/PageHeader";
import { ResolverNC } from "@/components/ResolverNC";

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
import { formatarData, listarInspecoes, listarNCs, listarObras } from "@/lib/db";
import { categoriasChecklist } from "@/lib/mock-data";

export const Route = createFileRoute("/nao-conformidades")({
  head: () => ({
    meta: [
      { title: "Não Conformidades — Previna SST" },
      {
        name: "description",
        content:
          "Acompanhe não conformidades de segurança do trabalho com filtros por obra, severidade, status e período.",
      },
      { property: "og:title", content: "Não Conformidades — Previna SST" },
      {
        property: "og:description",
        content: "Painel de não conformidades com filtros e evidências fotográficas.",
      },
    ],
  }),
  component: NCPage,
});

const SEVERIDADES = ["Baixa", "Média", "Alta", "Crítica"];
const STATUS = ["Aberta", "Em tratativa", "Atrasada", "Concluída"];
const TODOS = "todos";

function NCPage() {
  const qc = useQueryClient();
  const [obra, setObra] = useState(TODOS);
  const [severidade, setSeveridade] = useState(TODOS);
  const [status, setStatus] = useState(TODOS);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    inspecao_id: "",
    categoria: categoriasChecklist[0] ?? "",
    descricao: "",
    severidade: "Média",
    prazo: "",
    status: "Aberta",
    observacao: "",
  });

  const { data: ncs = [], isLoading } = useQuery({ queryKey: ["ncs-todas"], queryFn: listarNCs });
  const { data: obras = [] } = useQuery({ queryKey: ["obras"], queryFn: listarObras });
  const { data: inspecoes = [] } = useQuery({ queryKey: ["inspecoes"], queryFn: listarInspecoes });

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nao_conformidades").insert({
        inspecao_id: form.inspecao_id || null,
        categoria: form.categoria,
        descricao: form.descricao,
        severidade: form.severidade,
        prazo: form.prazo || null,
        status: form.status,
        observacao: form.observacao || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ncs-todas"] });
      setAberto(false);
      setForm({ ...form, descricao: "", prazo: "", observacao: "" });
      toast.success("Não conformidade registrada");
    },
    onError: (e: Error) => toast.error("Erro ao registrar", { description: e.message }),
  });

  const filtradas = useMemo(
    () =>
      ncs.filter((nc) => {
        const nomeObra = nc.inspecoes?.obras?.nome ?? "";
        const dataRef = nc.inspecoes?.data ?? nc.data_criacao.slice(0, 10);
        if (obra !== TODOS && nomeObra !== obra) return false;
        if (severidade !== TODOS && nc.severidade !== severidade) return false;
        if (status !== TODOS && nc.status !== status) return false;
        if (de && dataRef < de) return false;
        if (ate && dataRef > ate) return false;
        return true;
      }),
    [ncs, obra, severidade, status, de, ate],
  );

  const limpar = () => {
    setObra(TODOS);
    setSeveridade(TODOS);
    setStatus(TODOS);
    setDe("");
    setAte("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Não Conformidades"
        description="Desvios identificados nas inspeções e seu estágio de tratativa."
        action={
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
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
                  criar.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label>Inspeção</Label>
                  <Select
                    value={form.inspecao_id}
                    onValueChange={(v) => setForm({ ...form, inspecao_id: v })}
                  >
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Selecione a inspeção" />
                    </SelectTrigger>
                    <SelectContent>
                      {inspecoes.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.numero} — {i.obras?.nome ?? "Sem obra"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select
                    value={form.categoria}
                    onValueChange={(v) => setForm({ ...form, categoria: v })}
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
                  <Label htmlFor="d">Descrição</Label>
                  <Textarea
                    id="d"
                    required
                    rows={3}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Severidade</Label>
                    <Select
                      value={form.severidade}
                      onValueChange={(v) => setForm({ ...form, severidade: v })}
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
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p">Prazo</Label>
                  <Input
                    id="p"
                    type="date"
                    className="h-12"
                    value={form.prazo}
                    onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" size="lg" className="h-12 w-full" disabled={criar.isPending}>
                    Registrar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Obra</Label>
            <Select value={obra} onValueChange={setObra}>
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas as obras</SelectItem>
                {obras.map((o) => (
                  <SelectItem key={o.id} value={o.nome}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Severidade</Label>
            <Select value={severidade} onValueChange={setSeveridade}>
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="de">De</Label>
            <Input id="de" type="date" className="h-12" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ate">Até</Label>
            <Input id="ate" type="date" className="h-12" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
          <div className="sm:col-span-2 xl:col-span-5">
            <Button variant="ghost" size="sm" onClick={limpar}>
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
      <p className="text-sm text-muted-foreground">
        {filtradas.length} não conformidade(s) encontrada(s).
      </p>

      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((nc) => (
                <TableRow key={nc.id}>
                  <TableCell className="font-medium">{nc.numero}</TableCell>
                  <TableCell>{nc.inspecoes?.obras?.nome ?? "—"}</TableCell>
                  <TableCell>{nc.categoria}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {nc.descricao}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={nc.severidade} />
                  </TableCell>
                  <TableCell>{formatarData(nc.prazo)}</TableCell>
                  <TableCell>
                    <StatusBadge value={nc.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <ResolverNC
                        ncId={nc.id}
                        numero={nc.numero}
                        concluida={nc.status === "Concluída"}
                      />
                      <FotoDialog
                        tabela="fotos_nao_conformidade"
                        coluna="nao_conformidade_id"
                        valor={nc.id}
                        titulo={`Fotos da NC ${nc.numero}`}
                      />
                      {nc.inspecao_id ? (
                        <Button asChild variant="ghost" size="sm" className="gap-1">
                          <Link to="/inspecoes/$id" params={{ id: nc.inspecao_id }}>
                            <Eye className="size-4" /> Inspeção
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:hidden">
        {filtradas.map((nc) => (
          <Card key={nc.id}>
            <CardContent className="space-y-2 p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="truncate font-semibold">
                  {nc.numero} · {nc.categoria}
                </p>
                <StatusBadge value={nc.severidade} />
              </div>
              <p className="text-sm text-muted-foreground">{nc.descricao}</p>
              <p className="text-sm">{nc.inspecoes?.obras?.nome ?? "Sem obra"}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <StatusBadge value={nc.status} />
                <span className="text-muted-foreground">Prazo: {formatarData(nc.prazo)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <FotoDialog
                  tabela="fotos_nao_conformidade"
                  coluna="nao_conformidade_id"
                  valor={nc.id}
                  titulo={`Fotos da NC ${nc.numero}`}
                />
                <ResolverNC
                  ncId={nc.id}
                  numero={nc.numero}
                  concluida={nc.status === "Concluída"}
                />
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
