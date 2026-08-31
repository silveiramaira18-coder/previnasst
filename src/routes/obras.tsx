import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RequerPermissao } from "@/components/RequerPermissao";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, listarObras, type Obra } from "@/lib/db";

export const Route = createFileRoute("/obras")({
  head: () => ({
    meta: [
      { title: "Obras — Previna SST" },
      {
        name: "description",
        content: "Cadastro e acompanhamento das obras e empresas inspecionadas no Previna SST.",
      },
      { property: "og:title", content: "Obras — Previna SST" },
      {
        property: "og:description",
        content: "Cadastro e acompanhamento das obras e empresas inspecionadas no Previna SST.",
      },
    ],
  }),
  component: ObrasPageProtegido,
});

const STATUS = ["Em andamento", "Concluída", "Pausada", "Cancelada"];

const vazio = { nome: "", empresa: "", responsavel: "", status: "Em andamento" };

function ObrasPage() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [obraExcluir, setObraExcluir] = useState<Obra | null>(null);
  const [form, setForm] = useState(vazio);

  const { data: obras = [], isLoading } = useQuery({ queryKey: ["obras"], queryFn: listarObras });

  const abrirNova = () => {
    setEditandoId(null);
    setForm(vazio);
    setAberto(true);
  };

  const abrirEdicao = (o: Obra) => {
    setEditandoId(o.id);
    setForm({
      nome: o.nome ?? "",
      empresa: o.empresa ?? "",
      responsavel: o.responsavel ?? "",
      status: o.status ?? "Em andamento",
    });
    setAberto(true);
  };

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        empresa: form.empresa || null,
        responsavel: form.responsavel || null,
        status: form.status,
      };
      if (editandoId) {
        const { error } = await supabase.from("obras").update(payload).eq("id", editandoId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("obras").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obras"] });
      qc.invalidateQueries({ queryKey: ["indicadores"] });
      toast.success(editandoId ? "Obra atualizada" : "Obra cadastrada");
      setAberto(false);
      setEditandoId(null);
      setForm(vazio);
    },
    onError: (e: Error) => toast.error("Erro ao salvar obra", { description: e.message }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("obras").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obras"] });
      qc.invalidateQueries({ queryKey: ["indicadores"] });
      toast.success("Obra excluída");
      setObraExcluir(null);
    },
    onError: (e: Error) => toast.error("Erro ao excluir obra", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obras"
        description="Empresas e canteiros acompanhados pela equipe de segurança."
        action={
          <Button size="lg" className="gap-2" onClick={abrirNova}>
            <Plus className="size-4" /> Nova Obra
          </Button>
        }
      />

      <Dialog
        open={aberto}
        onOpenChange={(v) => {
          setAberto(v);
          if (!v) setEditandoId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar obra" : "Nova obra"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              salvar.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome da obra</Label>
              <Input
                id="nome"
                required
                maxLength={140}
                className="h-12"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                maxLength={140}
                className="h-12"
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tst">TST responsável</Label>
              <Input
                id="tst"
                maxLength={140}
                className="h-12"
                placeholder="Profissional responsável pela obra"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              />
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
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 w-full sm:w-auto"
                onClick={() => setAberto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="lg" className="h-12 w-full sm:w-auto" disabled={salvar.isPending}>
                {editandoId ? "Salvar alterações" : "Salvar obra"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando obras...</p> : null}
      {!isLoading && obras.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma obra cadastrada ainda. Use o botão "Nova Obra" para começar.
        </p>
      ) : null}

      {obras.length > 0 ? (
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da obra</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>TST responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obras.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.nome}</TableCell>
                    <TableCell>{o.empresa}</TableCell>
                    <TableCell>{o.responsavel}</TableCell>
                    <TableCell>
                      <StatusBadge value={o.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatarData(o.data_criacao)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => abrirEdicao(o)}
                        >
                          <Pencil className="size-3.5" /> Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => setObraExcluir(o)}
                        >
                          <Trash2 className="size-3.5" /> Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:hidden">
        {obras.map((o) => (
          <Card key={o.id}>
            <CardContent className="space-y-2 p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <p className="truncate font-semibold">{o.nome}</p>
                </div>
                <StatusBadge value={o.status} />
              </div>
              <p className="text-sm text-muted-foreground">{o.empresa}</p>
              <p className="text-sm">
                <span className="text-muted-foreground">TST responsável: </span>
                {o.responsavel || "—"}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
                <span className="text-muted-foreground">{formatarData(o.data_criacao)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => abrirEdicao(o)}>
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={() => setObraExcluir(o)}
                  >
                    <Trash2 className="size-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ObrasPageProtegido() {
  return (
    <RequerPermissao permissao="gerenciarObras">
      <ObrasPage />
    </RequerPermissao>
  );
}
