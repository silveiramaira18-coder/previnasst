import { createFileRoute } from "@tanstack/react-router";
import { Plus, ListChecks } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checklists, categoriasChecklist } from "@/lib/mock-data";

export const Route = createFileRoute("/checklists")({
  head: () => ({
    meta: [
      { title: "Checklists de Segurança — SafeCheck" },
      {
        name: "description",
        content:
          "Modelos de checklist de segurança do trabalho por categoria: altura, EPI, elétrica, andaimes e mais.",
      },
      { property: "og:title", content: "Checklists de Segurança — SafeCheck" },
      {
        property: "og:description",
        content: "Modelos de checklist de segurança do trabalho organizados por categoria.",
      },
    ],
  }),
  component: ChecklistsPage,
});

function ChecklistsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklists"
        description="Modelos de verificação que serão aplicados durante as inspeções."
        action={
          <Button size="lg" disabled className="gap-2">
            <Plus className="size-4" /> Novo Checklist
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {categoriasChecklist.map((c) => (
          <Badge key={c} variant="secondary" className="rounded-full px-3 py-1 text-xs">
            {c}
          </Badge>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Área preparada para o cadastro de checklists. Os modelos abaixo são demonstrativos.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {checklists.map((cl) => (
          <Card key={cl.id} className="h-full">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <ListChecks className="size-4 shrink-0 text-primary" />
                  <p className="truncate font-semibold">{cl.categoria}</p>
                </div>
                <StatusBadge value={cl.status} />
              </div>
              <p className="text-sm text-muted-foreground">{cl.descricao}</p>
              <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span>{cl.id}</span>
                <span>{cl.itens} itens</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}