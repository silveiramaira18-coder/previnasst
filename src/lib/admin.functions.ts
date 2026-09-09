import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type UsuarioAdmin = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  empresa: string;
  criadoEm: string;
  ativo: boolean;
};

/** Lista os usuários cadastrados — restrito à administradora principal. */
export const listarUsuariosAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioAdmin[]> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito à administradora principal.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error(error.message);

    const { data: perfis } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, empresa, cargo");
    const porId = new Map((perfis ?? []).map((p) => [p.id, p]));

    return data.users.map((u) => {
      const perfil = porId.get(u.id);
      const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
      return {
        id: u.id,
        nome: perfil?.nome || meta['nome'] || "Sem nome",
        email: u.email ?? "—",
        cargo: perfil?.cargo || meta['cargo'] || "—",
        empresa: perfil?.empresa || meta['empresa'] || "—",
        criadoEm: u.created_at,
        ativo: !u.banned_until,
      };
    });
  });
