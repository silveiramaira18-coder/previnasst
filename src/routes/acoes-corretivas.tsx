import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { acoesCorretivas } from "@/lib/mock-data";

export const Route = createFileRoute("/acoes-corretivas")({
  head: () => ({
    meta: [
      { title: "Ações Corretivas — SafeCheck" },
      {
        name: "description",
        content:
          "Acompanhamento das ações corretivas vinculadas às não conformidades, com responsável e prazo.",
      },
      { property: "og:title", content: "Ações Corretivas — SafeCheck" },
      {
        property: "og:description",
        content: "Acompanhe responsáveis, prazos e status das ações corretivas.",
      },
    ],
  }),
  component: AcoesPage,
});

function AcoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ações Corretivas"
        description="Tratativas vinculadas às não conformidades identificadas em campo."
      />

      <p className="text-xs text-muted-foreground">
        Interface preparada para o controle de ações corretivas. Registros abaixo são
        demonstrativos.
      </p>

      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Não conformidade</TableHead>
                <TableHead>Ação corretiva</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acoesCorretivas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.nc}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {a.ncDescricao}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[340px]">{a.acao}</TableCell>
                  <TableCell>{a.responsavel}</TableCell>
                  <TableCell>{a.prazo}</TableCell>
                  <TableCell>
                    <StatusBadge value={a.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:hidden">
        {acoesCorretivas.map((a) => (
          <Card key={a.id}>
            <CardContent className="space-y-2 p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="truncate font-semibold">
                  {a.id} · {a.nc}
                </p>
                <StatusBadge value={a.status} />
              </div>
              <p className="text-sm text-muted-foreground">{a.acao}</p>
              <div className="flex flex-wrap justify-between gap-2 pt-1 text-sm">
                <span>{a.responsavel}</span>
                <span className="text-muted-foreground">Prazo: {a.prazo}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}