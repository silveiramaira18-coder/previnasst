import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Mail } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMAIL = "previnasst2@gmail.com";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte — Previna SST" },
      {
        name: "description",
        content: "Fale com a equipe do Previna SST para tirar dúvidas ou relatar problemas.",
      },
      { property: "og:title", content: "Suporte — Previna SST" },
      {
        property: "og:description",
        content: "Canal de atendimento do Previna SST por e-mail.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuportePage,
});

function SuportePage() {
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const enviar = () => {
    const url = `mailto:${EMAIL}?subject=${encodeURIComponent(
      assunto ? `Suporte - App Previna SST · ${assunto}` : "Suporte - App Previna SST",
    )}&body=${encodeURIComponent(mensagem)}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Precisa de ajuda ou tem alguma dúvida?"
        description="Nossa equipe responde o mais rápido possível."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LifeBuoy className="size-5" /> Fale conosco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">E-mail de contato:</p>
          <p className="break-all text-xl font-semibold">{EMAIL}</p>
          <Button asChild size="lg" className="h-12 w-full gap-2 sm:w-auto">
            <a href={`mailto:${EMAIL}?subject=${encodeURIComponent("Suporte - App Previna SST")}`}>
              <Mail className="size-4" /> Enviar e-mail
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enviar mensagem pelo app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              className="h-12"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex.: Dúvida sobre relatório"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              rows={5}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva sua dúvida ou o problema encontrado"
            />
          </div>
          <Button size="lg" className="h-12 w-full" onClick={enviar}>
            Enviar solicitação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
