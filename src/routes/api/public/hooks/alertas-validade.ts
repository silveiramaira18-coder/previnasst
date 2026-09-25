import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Rotina diária: avisa por e-mail quando um documento do GED vence em
 * exatamente 7 dias. Destinatários: autor do cadastro + administradores.
 * Resend em modo teste: entrega no e-mail da titular, indicando os reais.
 */
const EMAIL_TESTE = "silveiramaira18@gmail.com";
const ADMINS = ["silveiramaira18@gmail.com", "previnasst2@gmail.com"];
const REMETENTE = "Previna SST <onboarding@resend.dev>";
const GATEWAY = "https://connector-gateway.lovable.dev/resend";

type Doc = { id: string; title: string; expiration_date: string; user_id: string; origem: string };

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/public/hooks/alertas-validade")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const segredo = process.env["CRON_SECRET"];
        if (!segredo || request.headers.get("x-cron-secret") !== segredo)
          return json({ error: "Não autorizado" }, 401);

        const lovableKey = process.env["LOVABLE_API_KEY"];
        const resendKey = process.env["RESEND_API_KEY"];
        if (!lovableKey || !resendKey) return json({ error: "E-mail não configurado" }, 500);

        const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // Data de hoje em Brasília (UTC-3) + 7 dias
        const agora = new Date(Date.now() - 3 * 3600_000);
        const hoje = agora.toISOString().slice(0, 10);
        const alvo = new Date(agora.getTime() + 7 * 86400_000).toISOString().slice(0, 10);

        const [emp, col] = await Promise.all([
          sb.from("company_documents")
            .select("id, title, expiration_date, user_id, contractors(name)")
            .eq("status", "active").eq("expiration_date", alvo).is("alerta_7d_enviado", null),
          sb.from("employee_documents")
            .select("id, title, expiration_date, user_id, employees(name)")
            .eq("status", "active").eq("expiration_date", alvo).is("alerta_7d_enviado", null),
        ]);
        if (emp.error || col.error) return json({ error: emp.error?.message ?? col.error?.message }, 500);

        const docsEmp: (Doc & { tabela: string })[] = (emp.data ?? []).map((d: any) => ({
          ...d, tabela: "company_documents",
          origem: d.contractors?.name ? `Terceirizada: ${d.contractors.name}` : "Empresa própria",
        }));
        const docsCol: (Doc & { tabela: string })[] = (col.data ?? []).map((d: any) => ({
          ...d, tabela: "employee_documents", origem: `Colaborador: ${d.employees?.name ?? "—"}`,
        }));
        const docs = [...docsEmp, ...docsCol];
        if (docs.length === 0) return json({ ok: true, documentos: 0, enviados: 0 });

        // Agrupa por autor
        const porAutor = new Map<string, typeof docs>();
        for (const d of docs) porAutor.set(d.user_id, [...(porAutor.get(d.user_id) ?? []), d]);

        let enviados = 0;
        for (const [autorId, lista] of porAutor) {
          const { data: u } = await sb.auth.admin.getUserById(autorId);
          const destinatarios = Array.from(
            new Set([u?.user?.email?.toLowerCase(), ...ADMINS].filter(Boolean) as string[]),
          );
          const linhas = lista
            .map(
              (d) => `<div style="border:1px solid #E5E0D8;border-left:5px solid #D97706;border-radius:8px;padding:12px;margin-bottom:10px">
                <p style="margin:0 0 4px;font-weight:700;color:#1F2937">${esc(d.title)}</p>
                <p style="margin:0 0 4px;color:#57524A">${esc(d.origem)}</p>
                <p style="margin:0;font-weight:700;color:#B45309">⏳ ATENÇÃO: vence em 7 dias (${new Date(`${d.expiration_date}T12:00:00`).toLocaleDateString("pt-BR")})</p>
              </div>`,
            )
            .join("");
          const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#ffffff;padding:20px">
            <p style="font-family:Arial;background:#FEF3C7;padding:10px;border-radius:6px;color:#57524A">Modo de teste: este aviso seria enviado para <b>${esc(destinatarios.join(", "))}</b>.</p>
            <p style="font-size:12px;letter-spacing:1px;color:#57524A;margin:0">PREVINA SST</p>
            <h2 style="margin:4px 0 16px;color:#1F2937">Documentos que vencem em 7 dias</h2>
            ${linhas}
            <p style="color:#57524A;font-size:12px">Atualize os documentos na Gestão Documental antes do vencimento.</p>
          </body></html>`;

          const r = await fetch(`${GATEWAY}/emails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": resendKey,
            },
            body: JSON.stringify({
              from: REMETENTE,
              to: [EMAIL_TESTE],
              subject: `⏳ [Previna SST] ${lista.length} documento(s) vencem em 7 dias`,
              html,
            }),
          });
          if (!r.ok) {
            console.error(`Falha no envio [${r.status}]: ${await r.text()}`);
            continue;
          }
          enviados++;
          for (const tabela of ["company_documents", "employee_documents"]) {
            const ids = lista.filter((d) => d.tabela === tabela).map((d) => d.id);
            if (ids.length) await sb.from(tabela).update({ alerta_7d_enviado: hoje }).in("id", ids);
          }
        }
        return json({ ok: true, documentos: docs.length, enviados });
      },
    },
  },
});
