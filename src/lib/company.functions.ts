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
    return { url, enviado: false, aviso: "Não enviado — domínio de envio não configurado. Compartilhe o link diretamente com o convidado." };
  });