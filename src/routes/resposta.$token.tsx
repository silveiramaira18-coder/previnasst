import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, CheckCircle2, ShieldCheck } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { enviarSolucaoPortal, obterPortalNC } from "@/lib/portal.functions";

export const Route = createFileRoute("/resposta/$token")({
  head: () => ({
    meta: [
      { title: "Responder pendência — Previna SST" },
      { name: "description", content: "Envie a foto da correção de uma não conformidade de segurança." },
      { property: "og:title", content: "Responder pendência — Previna SST" },
      { property: "og:description", content: "Envie a foto da correção sem precisar entrar no sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: PortalResposta,
});

const paraBase64 = (f: File) =>
  new Promise<string>((ok, erro) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = erro;
    r.readAsDataURL(f);
  });

function PortalResposta() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const obter = useServerFn(obterPortalNC);
  const enviar = useServerFn(enviarSolucaoPortal);
  const input = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", token],
    queryFn: () => obter({ data: { token } }),
    retry: false,
  });

  const envio = useMutation({
    mutationFn: async (f: File) => {
      if (f.size > 10 * 1024 * 1024) throw new Error("A foto deve ter no máximo 10 MB.");
      await enviar({ data: { token, nome: f.name, tipo: f.type || "image/jpeg", arquivoBase64: await paraBase64(f) } });
    },
    onSuccess: () => {
      toast.success("Foto enviada! Aguarde a validação da equipe de segurança.");
      qc.invalidateQueries({ queryKey: ["portal", token] });
    },
    onError: (e: Error) => toast.error("Não foi possível enviar", { description: e.message }),
  });

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-2 text-lg font-bold">
        <ShieldCheck className="size-6 text-primary" /> Previna SST
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando pendência...</p>
      ) : error || !data ? (
        <Card><CardContent className="p-6 text-center text-sm">Este link é inválido ou expirou. Peça um novo link à equipe de segurança.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-xs text-muted-foreground">{data.obra}{data.local ? ` · ${data.local}` : ""}</p>
              <h1 className="text-xl font-semibold">Pendência {data.numero}</h1>
              <p>{data.descricao}</p>
              <p className="text-sm text-muted-foreground">
                Severidade: {data.severidade} · Prazo: {data.prazo ? new Date(`${data.prazo}T12:00:00`).toLocaleDateString("pt-BR") : "sem prazo"}
              </p>
              <p className="text-sm font-medium">Situação: {data.status}</p>
              {data.motivoRejeicao && data.status !== "Aguardando validação" ? (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Ajuste solicitado: {data.motivoRejeicao}</p>
              ) : null}
            </CardContent>
          </Card>

          <section className="space-y-2">
            <h2 className="font-semibold">Foto do problema</h2>
            {data.fotosProblema.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem foto registrada.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {data.fotosProblema.map((u) => <img key={u} src={u} alt="Problema" className="aspect-square w-full rounded-xl object-cover" />)}
              </div>
            )}
          </section>

          {data.fotosSolucao.length > 0 ? (
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-success" /> Fotos da correção enviadas</h2>
              <div className="grid grid-cols-2 gap-2">
                {data.fotosSolucao.map((u) => <img key={u} src={u} alt="Correção" className="aspect-square w-full rounded-xl object-cover" />)}
              </div>
            </section>
          ) : null}

          {data.status === "Concluída" ? (
            <p className="rounded-lg bg-muted p-4 text-center font-medium">Pendência concluída. Obrigado!</p>
          ) : (
            <>
              <input ref={input} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) envio.mutate(f); e.target.value = ""; }} />
              <Button className="h-14 w-full text-base" disabled={envio.isPending} onClick={() => input.current?.click()}>
                <Camera className="size-5" /> {envio.isPending ? "Enviando..." : "Enviar foto da correção"}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
