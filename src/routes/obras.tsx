import { createFileRoute } from "@tanstack/react-router";
import { Plus, Building2 } from "lucide-react";

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
import { obras } from "@/lib/mock-data";

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

function ObrasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Obras"
        description="Empresas e canteiros acompanhados pela equipe de segurança."
        action={
          <Button size="lg" disabled className="gap-2">
            <Plus className="size-4" /> Nova Obra
          </Button>
        }
      />

      <p className="text-xs text-muted-foreground">
        O cadastro de obras será habilitado quando o armazenamento de dados for implementado.
        Abaixo, exemplos ilustrativos.
      </p>

      {/* Tabela — desktop */}
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
                  <TableCell className="text-muted-foreground">{o.cadastro}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cards — mobile */}
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
                <span className="text-muted-foreground">{o.cadastro}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}