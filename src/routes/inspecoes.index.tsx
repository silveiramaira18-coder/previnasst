import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, ImageIcon, Plus, TriangleAlert } from "lucide-react";

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
import { inspecoes } from "@/lib/mock-data";

export const Route = createFileRoute("/inspecoes/")({
  head: () => ({
    meta: [
      { title: "Inspeções Realizadas — SafeCheck" },
      {
        name: "description",
        content:
          "Histórico de inspeções de segurança do trabalho com obra, responsável, status, fotos e não conformidades.",
      },
      { property: "og:title", content: "Inspeções Realizadas — SafeCheck" },
      {
        property: "og:description",
        content: "Histórico completo das inspeções de segurança registradas em campo.",
      },
    ],
  }),
  component: InspecoesPage,
});

function InspecoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspeções"
        description="Registros realizados em campo pela equipe de segurança."
        action={
          <Button asChild size="lg" className="gap-2">
            <Link to="/nova-inspecao">
              <Plus className="size-4" /> Nova Inspeção
            </Link>
          </Button>
        }
      />

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
                  <TableCell className="font-medium">{i.id}</TableCell>
                  <TableCell>{i.obra}</TableCell>
                  <TableCell>{i.data}</TableCell>
                  <TableCell>{i.hora}</TableCell>
                  <TableCell>{i.responsavel}</TableCell>
                  <TableCell className="text-muted-foreground">{i.local}</TableCell>
                  <TableCell>
                    <StatusBadge value={i.status} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <ImageIcon className="size-4" /> {i.fotos}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <TriangleAlert className="size-4" /> {i.ncs}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <Link to="/inspecoes/$id" params={{ id: i.id }}>
                        <Eye className="size-4" /> Visualizar
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:hidden">
        {inspecoes.map((i) => (
          <Card key={i.id}>
            <CardContent className="space-y-2 p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="truncate font-semibold">
                  {i.id} · {i.obra}
                </p>
                <StatusBadge value={i.status} />
              </div>
              <p className="text-sm text-muted-foreground">{i.local}</p>
              <p className="text-sm">
                {i.data} às {i.hora} · {i.responsavel}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ImageIcon className="size-4" /> {i.fotos} fotos
                </span>
                <span className="inline-flex items-center gap-1">
                  <TriangleAlert className="size-4" /> {i.ncs} NCs
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