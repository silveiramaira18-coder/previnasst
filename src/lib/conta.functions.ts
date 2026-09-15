import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMAILS_ADMIN = ["silveiramaira18@gmail.com", "previnasst2@gmail.com"];

/** Exclui definitivamente a conta do próprio usuário autenticado. */
export const excluirMinhaConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String(context.claims?.["email"] ?? "").toLowerCase();
    if (EMAILS_ADMIN.includes(email)) {
      throw new Error("A conta da administradora principal não pode ser excluída pelo sistema.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
