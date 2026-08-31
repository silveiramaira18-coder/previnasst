import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Eye, ImageIcon, Pencil, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { gerarPdfInspecao } from "@/lib/pdf";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarHora } from "@/lib/db";

export const Route = createFileRoute("/inspecoes/")({
  head: () => ({
    meta: [
      { title: "Inspeções Realizadas — Previna SST" },
      {
        name: "description",
        content:
          "Histórico de inspeções de segurança do trabalho com obra, responsável, status, fotos e não conformidades.",
      },
      { property: "og:title", content: "Inspeções Realizadas — Previna SST" },
      {
        property: "og:description",
        content: "Histórico completo das inspeções de segurança registradas em campo.",
      },
    ],
  }),
  component: InspecoesPage,
});

type Linha = {
  id: string;
  numero: string;
  data: string;
  horario: string | null;
  responsavel: string | null;
  local: string | null;
  status: string;
  obras: { nome: string } | null;
  fotos_inspecao: { count: number }[];
  nao_conformidades: { count: number }[];
};

async function listar() {
  const { data, error } = await supabase
    .from("inspecoes")
    .select(
      "id, numero, data, horario, responsavel, local, status, obras(nome), fotos_inspecao(count), nao_conformidades(count)",
    )
    .order("data", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Linha[];
}

const num = (arr: { count: number }[] | null | undefined) => arr?.[0]?.count ?? 0;

function InspecoesPage() {
  const { data: inspecoes = [], isLoading } = useQuery({
    queryKey: ["inspecoes-lista"],
    queryFn: listar,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspeções Realizadas"
        description="Registros realizados em campo pela equipe de segurança."
      />

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando inspeções...</p> : null}
      {!isLoading && inspecoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma inspeção registrada ainda. Comece por "Nova Inspeção".
        </p>
      ) : null}

      {inspecoes.length > 0 ? (
        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fotos</TableHead>
                  <TableHead>NCs</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspecoes.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.numero}</TableCell>
                    <TableCell>{i.obras?.nome ?? "—"}</TableCell>
                    <TableCell>{formatarData(i.data)}</TableCell>
                    <TableCell>{formatarHora(i.horario)}</TableCell>
                    <TableCell>{i.responsavel}</TableCell>
                    <TableCell className="text-muted-foreground">{i.local}</TableCell>
                    <TableCell>
                      <StatusBadge value={i.status} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <ImageIcon className="size-4" /> {num(i.fotos_inspecao)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <TriangleAlert className="size-4" /> {num(i.nao_conformidades)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm" className="gap-1">
                          <Link to="/inspecoes/$id" params={{ id: i.id }}>
                            <Eye className="size-4" /> Visualizar
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="gap-1">
                          <Link to="/inspecoes/$id" params={{ id: i.id }} search={{ editar: true }}>
                            <Pencil className="size-3.5" /> Editar
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={gerando === i.id}
                          onClick={() => baixarPdf(i.id)}
                        >
                          <Download className="size-3.5" /> Baixar PDF
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

      <div className="grid gap-3 lg:hidden">
        {inspecoes.map((i) => (
          <Card key={i.id}>
            <CardContent className="space-y-2 p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="truncate font-semibold">
                  {i.numero} · {i.obras?.nome ?? "Sem obra"}
                </p>
                <StatusBadge value={i.status} />
              </div>
              <p className="text-sm text-muted-foreground">{i.local}</p>
              <p className="text-sm">
                {formatarData(i.data)} às {formatarHora(i.horario)} · {i.responsavel}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ImageIcon className="size-4" /> {num(i.fotos_inspecao)} fotos
                </span>
                <span className="inline-flex items-center gap-1">
                  <TriangleAlert className="size-4" /> {num(i.nao_conformidades)} NCs
                </span>
              </div>
              <Button asChild variant="outline" size="lg" className="w-full gap-1">
                <Link to="/inspecoes/$id" params={{ id: i.id }}>
                  <Eye className="size-4" /> Visualizar
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
