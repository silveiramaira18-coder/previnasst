import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, listarObras } from "@/lib/db";

export const Route = createFileRoute("/obras")({
  head: () => ({
    meta: [
      { title: "Obras — SafeCheck" },
      {
        name: "description",
        content: "Cadastro e acompanhamento das obras e empresas inspecionadas no SafeCheck.",
      },
      { property: "og:title", content: "Obras — SafeCheck" },
      {
        property: "og:description",
        content: "Cadastro e acompanhamento das obras e empresas inspecionadas no SafeCheck.",
      },
    ],
  }),
  component: ObrasPage,
});

const STATUS = ["Em andamento", "Paralisada", "Concluída"];

function ObrasPage() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    empresa: "",
    endereco: "",
    responsavel: "",
    status: "Em andamento",
  });

  const { data: obras = [], isLoading } = useQuery({ queryKey: ["obras"], queryFn: listarObras });

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("obras").insert(form);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obras"] });
      setAberto(false);
      setForm({ nome: "", empresa: "", endereco: "", responsavel: "", status: "Em andamento" });
      toast.success("Obra cadastrada");
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obras"
        description="Empresas e canteiros acompanhados pela equipe de segurança."
        action={
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="size-4" /> Nova Obra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova obra</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  criar.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome da obra</Label>
                  <Input
                    id="nome"
                    required
                    className="h-12"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    className="h-12"
                    value={form.empresa}
                    onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    className="h-12"
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    className="h-12"
                    value={form.responsavel}
                    onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
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
                    Salvar obra
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

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
                  <TableHead>Endereço</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obras.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.nome}</TableCell>
                    <TableCell>{o.empresa}</TableCell>
                    <TableCell className="text-muted-foreground">{o.endereco}</TableCell>
                    <TableCell>{o.responsavel}</TableCell>
                    <TableCell>
                      <StatusBadge value={o.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatarData(o.data_criacao)}
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
              <p className="text-sm text-muted-foreground">{o.endereco}</p>
              <div className="flex flex-wrap justify-between gap-2 pt-1 text-sm">
                <span>{o.responsavel}</span>
                <span className="text-muted-foreground">{formatarData(o.data_criacao)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
