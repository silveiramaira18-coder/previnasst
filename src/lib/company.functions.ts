import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const convidarEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email().max(254) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("create_company_invitation", { p_email: data.email });
    const convite = rows?.[0];
    if (error || !convite) throw new Error(error?.message ?? "Não foi possível criar o convite.");
    const url = `https://previnasst.lovable.app/convite?token=${convite.token}`;
    // Existing Resend connection is intentionally in owner-only test mode.
    // Never redirect a sensitive invitation to the test account instead of its recipient.
    const destinatarioTeste = "silveiramaira18@gmail.com";
    if (data.email.trim().toLowerCase() !== destinatarioTeste) return { url, enviado: false, aviso: "Convite criado. O envio está em modo teste; copie o link e envie diretamente ao destinatário." };
    const key = process.env["LOVABLE_API_KEY"];
    const resend = process.env["RESEND_API_KEY"];
    if (!key || !resend) return { url, enviado: false, aviso: "Convite criado. Envio indisponível; compartilhe o link diretamente." };
    const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Connection-Api-Key": resend },
      body: JSON.stringify({ from: "Previna SST <onboarding@resend.dev>", to: [data.email], subject: "Convite para empresa — Previna SST", text: `Você foi convidado para ${convite.company_name}. Entre com este e-mail confirmado e aceite o convite em até 7 dias: ${url}`, headers: { "Idempotency-Key": convite.invitation_id } }),
    });
    if (!response.ok) return { url, enviado: false, aviso: `Convite criado, mas o envio falhou (${response.status}). Compartilhe o link diretamente.` };
    return { url, enviado: true, aviso: "Convite enviado por e-mail." };
  });