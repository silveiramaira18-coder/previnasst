import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AceitarConvite } from "@/components/EmpresaPerfil";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/convite")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s["token"] === "string" ? s["token"] : "" }),
  head: () => ({ meta: [
    { title: "Convite para empresa — Previna SST" },
    { name: "description", content: "Aceite seu convite para acessar a empresa no Previna SST." },
    { property: "og:title", content: "Convite para empresa — Previna SST" },
    { property: "og:description", content: "Acesso seguro à sua organização no Previna SST." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "referrer", content: "no-referrer" },
  ] }),
  component: Convite,
});
function Convite() {
  const { token } = Route.useSearch();
  const { session, loading } = useAuth();
  const valido = /^[a-f0-9]{64}$/.test(token);
  useEffect(() => { if (valido) sessionStorage.setItem("previna-convite", token); }, [valido, token]);
  return <main className="mx-auto max-w-lg space-y-5 px-5 py-12"><h1 className="text-2xl font-semibold">Convite para empresa</h1>{!valido ? <p role="alert" className="text-destructive">Convite inválido.</p> : loading ? <p>Carregando…</p> : session ? <AceitarConvite token={token} /> : <><p>Entre com o e-mail confirmado que recebeu o convite.</p><Button size="lg" onClick={() => window.location.assign("/auth")}>Entrar ou criar conta</Button></>}</main>;
}