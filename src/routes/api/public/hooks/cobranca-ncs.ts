import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Disparo diário de e-mails de cobrança das Não Conformidades pendentes.
 * Enquanto não há domínio próprio verificado, o Resend só entrega para o
 * e-mail da titular da conta — por isso todas as cobranças vão para ela,
 * identificando o responsável real de cada bloco.
 */
const EMAIL_TESTE = "silveiramaira18@gmail.com";
const REMETENTE = "Previna SST <onboarding@resend.dev>";
const GATEWAY = "https://connector-gateway.lovable.dev/resend";

type NCRow = {
  numero: string;
  descricao: string;
  severidade: string;
  prazo: string | null;
  status: string;
  responsaveis: string[] | null;
  inspecoes: {
    email_engenheiro: string | null;
    engenheiro_responsavel: string | null;
    obras: { nome: string; email_engenheiro: string | null; engenheiro_responsavel: string | null } | null;
  } | null;
  itens_inspecao: { local: string | null } | null;
};

const formatarData = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "sem prazo definido";

const diasAtePrazo = (prazo: string | null) => {
  if (!prazo) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${prazo}T00:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
};

const alerta = (prazo: string | null) => {
  const dias = diasAtePrazo(prazo);
  if (dias === null) return "Prazo não definido";
  if (dias < 0)
    return `🚨 VENCIDA HÁ ${Math.abs(dias)} DIA(S) (Prazo limite era ${formatarData(prazo)})`;
  if (dias === 0) return `🚨 VENCE HOJE (Prazo: ${formatarData(prazo)})`;
  return `⏳ Faltam ${dias} dia(s) para o vencimento (Prazo: ${formatarData(prazo)})`;
};

const escapar = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function montarHtml(responsavel: string, ncs: NCRow[]) {
  const blocos = ncs
    .map(
      (nc) => `
      <div style="border:1px solid #E5E0D8;border-left:5px solid #C2410C;border-radius:8px;padding:16px;margin-bottom:12px">
        <p style="margin:0 0 6px;font-weight:700;color:#1F2937">NC ${escapar(nc.numero)} — ${escapar(nc.severidade)}</p>
        <p style="margin:0 0 4px;color:#57524A"><b>Obra:</b> ${escapar(nc.inspecoes?.obras?.nome ?? "—")} &nbsp;|&nbsp; <b>Pavimento/Setor:</b> ${escapar(nc.itens_inspecao?.local ?? "—")}</p>
        <p style="margin:0 0 8px;color:#1F2937">${escapar(nc.descricao)}</p>
        <p style="margin:0;font-weight:700;color:#B91C1C">${escapar(alerta(nc.prazo))}</p>
      </div>`,
    )
    .join("");

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#ffffff;padding:20px">
    <p style="font-size:12px;letter-spacing:1px;color:#57524A;margin:0">PREVINA SST</p>
    <h2 style="margin:4px 0 16px;color:#1F2937">Não conformidades pendentes sob sua responsabilidade</h2>
    <p style="color:#57524A;margin:0 0 16px">Responsável: <b>${escapar(responsavel)}</b> — ${ncs.length} pendência(s) em aberto.</p>
    ${blocos}
    <p style="color:#57524A;font-size:12px">Este é um aviso automático diário. Assim que a NC for concluída no sistema, ela deixa de aparecer nesta lista.</p>
  </body></html>`;
}

export const Route = createFileRoute("/api/public/hooks/cobranca-ncs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const segredo = process.env["CRON_SECRET"];
        if (!segredo || request.headers.get("x-cron-secret") !== segredo) {
          return new Response(JSON.stringify({ error: "Não autorizado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const supabase = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const { data, error } = await supabase
          .from("nao_conformidades")
          .select(
            "numero, descricao, severidade, prazo, status, responsaveis, inspecoes(obras(nome)), itens_inspecao(local)",
          )
          .neq("status", "Concluída")
          .not("prazo", "is", null)
          .order("prazo", { ascending: true });

        if (error) {
          console.error("Falha ao ler não conformidades:", error.message);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const ncs = (data ?? []) as unknown as NCRow[];

        // Agrupa por responsável (nome + e-mail extraídos da tag "Nome (Cargo) <email>")
        const grupos = new Map<string, NCRow[]>();
        for (const nc of ncs) {
          for (const tag of nc.responsaveis ?? []) {
            if (!/<[^>]+>/.test(tag)) continue;
            const lista = grupos.get(tag) ?? [];
            lista.push(nc);
            grupos.set(tag, lista);
          }
        }

        const lovableKey = process.env["LOVABLE_API_KEY"];
        const resendKey = process.env["RESEND_API_KEY"];
        if (!lovableKey || !resendKey) {
          return new Response(JSON.stringify({ error: "E-mail não configurado" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let enviados = 0;
        for (const [tag, lista] of grupos) {
          const emailReal = tag.match(/<([^>]+)>/)?.[1]?.trim().toLowerCase() ?? "";
          const nome = tag.replace(/<[^>]+>/, "").trim() || emailReal;
          // Modo de teste: entrega no e-mail da conta, identificando o destinatário real.
          const destino = EMAIL_TESTE;

          const resposta = await fetch(`${GATEWAY}/emails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": resendKey,
            },
            body: JSON.stringify({
              from: REMETENTE,
              to: [destino],
              subject: `[Previna SST] ${lista.length} não conformidade(s) pendente(s) — ${nome}`,
              html:
                `<p style="font-family:Arial;background:#FEF3C7;padding:10px;border-radius:6px;color:#57524A">
                   Modo de teste: este aviso seria enviado para <b>${escapar(emailReal || "responsável sem e-mail")}</b>.
                 </p>` + montarHtml(nome, lista),
            }),
          });

          if (!resposta.ok) {
            const corpo = await resposta.text();
            console.error(`Falha no envio [${resposta.status}]: ${corpo}`);
            continue;
          }
          enviados += 1;
        }

        return new Response(JSON.stringify({ ok: true, responsaveis: grupos.size, enviados }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
