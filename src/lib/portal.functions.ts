import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STATUS_VALIDACAO = "Aguardando validação";
const EMAIL_TESTE = "silveiramaira18@gmail.com";
const REMETENTE = "Previna SST <onboarding@resend.dev>";
const GATEWAY = "https://connector-gateway.lovable.dev/resend";
const URL_PADRAO = "https://previnasst.lovable.app";

const origemSegura = (o?: string) =>
  o && /^https:\/\/[a-z0-9.-]+\.lovable\.app$|^http:\/\/localhost(:\d+)?$/.test(o) ? o : URL_PADRAO;

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Sb = { from: (t: string) => any };

/** Reaproveita um link válido da NC ou cria um novo (como o usuário logado; RLS aplica). */
async function obterToken(sb: Sb, ncId: string, userId: string) {
  const { data: nc, error } = await sb.from("nao_conformidades").select("id").eq("id", ncId).maybeSingle();
  if (error || !nc) throw new Error("Não conformidade não encontrada.");
  const { data: existente } = await sb
    .from("nc_links")
    .select("token")
    .eq("nao_conformidade_id", ncId)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (existente?.token) return existente.token as string;
  const { data: novo, error: e2 } = await sb
    .from("nc_links")
    .insert({ nao_conformidade_id: ncId, user_id: userId })
    .select("token")
    .single();
  if (e2) throw new Error(e2.message);
  return novo.token as string;
}

export const gerarLinkNC = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ncId: z.string().uuid(), origem: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const token = await obterToken(context.supabase as Sb, data.ncId, context.userId);
    return { url: `${origemSegura(data.origem)}/resposta/${token}` };
  });

export const enviarCobrancaNC = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ncId: z.string().uuid(), origem: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as Sb;
    const token = await obterToken(sb, data.ncId, context.userId);
    const url = `${origemSegura(data.origem)}/resposta/${token}`;
    const { data: nc } = await sb
      .from("nao_conformidades")
      .select(
        "numero, descricao, prazo, severidade, responsaveis, responsavel, obras(nome, email_engenheiro), inspecoes(email_engenheiro, obras(nome, email_engenheiro))",
      )
      .eq("id", data.ncId)
      .single();
    const obra = nc?.obras?.nome ?? nc?.inspecoes?.obras?.nome ?? "Obra";
    const emailReal =
      nc?.inspecoes?.email_engenheiro || nc?.obras?.email_engenheiro || nc?.inspecoes?.obras?.email_engenheiro || "";
    const responsavel = (nc?.responsaveis ?? []).join(", ") || nc?.responsavel || "Responsável";
    const prazo = nc?.prazo ? new Date(`${nc.prazo}T12:00:00`).toLocaleDateString("pt-BR") : "sem prazo";

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const resendKey = process.env["RESEND_API_KEY"];
    if (!lovableKey || !resendKey) throw new Error("Envio de e-mail não configurado.");

    const html = `
      <p style="font-family:Arial;background:#FEF3C7;padding:10px;border-radius:6px;color:#57524A">
        Modo de teste: este aviso seria enviado para <b>${esc(emailReal || "responsável sem e-mail cadastrado")}</b>.
      </p>
      <div style="font-family:Arial;color:#57524A">
        <h2 style="color:#1F2937">Não conformidade ${esc(nc?.numero ?? "")} — ${esc(obra)}</h2>
        <p>Olá, ${esc(responsavel)}.</p>
        <p>${esc(nc?.descricao ?? "")}</p>
        <p><b>Severidade:</b> ${esc(nc?.severidade ?? "")} · <b>Prazo:</b> ${prazo}</p>
        <p style="margin:24px 0">
          <a href="${url}" style="background:#C2410C;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:700">
            Enviar foto da correção
          </a>
        </p>
        <p style="font-size:12px">Não é preciso entrar no sistema. Link: ${url}</p>
      </div>`;

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
        subject: `⚠️ [Previna SST] Pendência ${nc?.numero ?? ""} - Obra ${obra}`,
        html,
      }),
    });
    if (!r.ok) throw new Error(`Falha no envio do e-mail (${r.status}).`);
    await sb.from("nao_conformidades").update({ ultimo_email_cobranca: new Date().toISOString() }).eq("id", data.ncId);
    return { ok: true, url };
  });

async function ncDoToken(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: link } = await supabaseAdmin
    .from("nc_links")
    .select("nao_conformidade_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!link || new Date(link.expires_at) < new Date()) throw new Error("Link inválido ou expirado.");
  return { admin: supabaseAdmin, ncId: link.nao_conformidade_id as string };
}

const tokenSchema = z.string().regex(/^[a-f0-9]{48}$/);

export const obterPortalNC = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { admin, ncId } = await ncDoToken(data.token);
    const { data: nc } = await admin
      .from("nao_conformidades")
      .select("numero, descricao, severidade, prazo, status, item_inspecao_id, motivo_rejeicao, obras(nome), inspecoes(obras(nome)), itens_inspecao(local)")
      .eq("id", ncId)
      .single();
    if (!nc) throw new Error("Pendência não encontrada.");
    const n = nc as any;
    let caminhos: string[] = [];
    if (n.item_inspecao_id) {
      const { data: f } = await admin.from("fotos_item_inspecao").select("url").eq("item_inspecao_id", n.item_inspecao_id);
      caminhos = (f ?? []).map((x) => x.url);
    }
    if (caminhos.length === 0) {
      const { data: f } = await admin.from("fotos_nao_conformidade").select("url").eq("nao_conformidade_id", ncId).eq("tipo", "problema");
      caminhos = (f ?? []).map((x) => x.url);
    }
    const { data: sol } = await admin.from("fotos_nao_conformidade").select("url").eq("nao_conformidade_id", ncId).eq("tipo", "solucao");
    const assinar = async (lista: string[]) =>
      (await Promise.all(lista.slice(0, 6).map((c) => admin.storage.from("fotos").createSignedUrl(c, 3600))))
        .map((r) => r.data?.signedUrl)
        .filter(Boolean) as string[];
    return {
      numero: n.numero as string,
      descricao: n.descricao as string,
      severidade: n.severidade as string,
      prazo: n.prazo as string | null,
      status: n.status as string,
      motivoRejeicao: n.motivo_rejeicao as string | null,
      obra: (n.obras?.nome ?? n.inspecoes?.obras?.nome ?? "Obra") as string,
      local: (n.itens_inspecao?.local ?? null) as string | null,
      fotosProblema: await assinar(caminhos),
      fotosSolucao: await assinar((sol ?? []).map((x) => x.url)),
    };
  });

export const enviarSolucaoPortal = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ token: tokenSchema, nome: z.string().max(200), arquivoBase64: z.string().max(14_000_000), tipo: z.string().regex(/^image\//) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin, ncId } = await ncDoToken(data.token);
    const { data: nc } = await admin.from("nao_conformidades").select("user_id, status").eq("id", ncId).single();
    if (!nc) throw new Error("Pendência não encontrada.");
    if (nc.status === "Concluída") throw new Error("Esta pendência já foi concluída.");
    const bytes = Uint8Array.from(atob(data.arquivoBase64), (c) => c.charCodeAt(0));
    const ext = (data.tipo.split("/")[1] ?? "jpg").replace(/[^a-z0-9]/g, "") || "jpg";
    const caminho = `${nc.user_id}/${ncId}/${crypto.randomUUID()}.${ext}`;
    const { error: up } = await admin.storage.from("fotos").upload(caminho, bytes, { contentType: data.tipo });
    if (up) throw new Error(up.message);
    const { error: ins } = await admin.from("fotos_nao_conformidade").insert({
      nao_conformidade_id: ncId,
      url: caminho,
      nome_arquivo: data.nome,
      user_id: nc.user_id,
      tipo: "solucao",
      descricao: "Enviada pelo responsável da obra (link externo)",
    });
    if (ins) throw new Error(ins.message);
    await admin.from("nao_conformidades").update({ status: STATUS_VALIDACAO }).eq("id", ncId);
    return { ok: true };
  });
