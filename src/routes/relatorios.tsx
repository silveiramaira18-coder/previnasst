import { createFileRoute } from "@tanstack/react-router";
import { FileText, FileBarChart, FileClock, FileWarning } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — SafeCheck" },
      {
        name: "description",
        content:
          "Área de relatórios de inspeções de segurança do trabalho, preparada para exportação em PDF.",
      },
      { property: "og:title", content: "Relatórios — SafeCheck" },
      {
        property: "og:description",
        content: "Modelos de relatórios de segurança do trabalho prontos para exportação futura.",
      },
    ],
  }),
  component: RelatoriosPage,
});

const modelos = [
  {
    icon: FileText,
    nome: "Relatório de Inspeção",
    desc: "Dados da inspeção, observações, evidências fotográficas e não conformidades.",
  },
  {
    icon: FileWarning,
    nome: "Relatório de Não Conformidades",
    desc: "Consolidado de desvios por obra, categoria e severidade.",
  },
  {
    icon: FileClock,
    nome: "Relatório de Ações Corretivas",
    desc: "Status, responsáveis e prazos das tratativas em aberto e atrasadas.",
  },
  {
    icon: FileBarChart,
    nome: "Relatório Gerencial de Conformidade",
    desc: "Indicadores e evolução do percentual de conformidade por período.",
  },
];

function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Modelos previstos para geração de relatórios profissionais."
      />

      <Card className="border-dashed">
        <CardContent className="p-5 text-sm text-muted-foreground">
          A geração de PDF ainda não está implementada. Esta área define os modelos que serão
          disponibilizados na próxima etapa do projeto.
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {modelos.map((m) => (
          <Card key={m.nome} className="h-full">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <m.icon className="size-5" />
                </div>
                <p className="truncate font-semibold">{m.nome}</p>
              </div>
              <p className="text-sm text-muted-foreground">{m.desc}</p>
              <Button variant="outline" size="lg" disabled className="mt-auto w-full">
                Gerar PDF (em breve)
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}