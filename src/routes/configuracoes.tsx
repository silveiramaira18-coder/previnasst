import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — SafeCheck" },
      {
        name: "description",
        content: "Preferências gerais do SafeCheck: empresa, equipe e padrões de inspeção.",
      },
      { property: "og:title", content: "Configurações — SafeCheck" },
      {
        property: "og:description",
        content: "Preferências gerais do SafeCheck: empresa, equipe e padrões de inspeção.",
      },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Preferências gerais do aplicativo. Nada é salvo nesta etapa."
      />

      <Card className="max-w-2xl">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="empresa">Empresa</Label>
            <Input id="empresa" className="h-11" placeholder="Nome da empresa" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resp">Responsável técnico</Label>
            <Input id="resp" className="h-11" placeholder="Nome e registro profissional" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prazo">Prazo padrão para ações corretivas (dias)</Label>
            <Input id="prazo" type="number" className="h-11" placeholder="7" disabled />
          </div>
          <Button size="lg" disabled className="w-full sm:w-auto">
            Salvar (em breve)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}