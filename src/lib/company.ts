import { supabase } from "@/integrations/supabase/client";

export async function empresaAtivaId() {
  const { data, error } = await supabase.rpc("active_company_id");
  if (error || !data) throw new Error("Não foi possível identificar a empresa. Entre novamente.");
  const { data: auth } = await supabase.auth.getSession();
  if (auth.session?.user.id) sessionStorage.setItem(`previna-company:${auth.session.user.id}`, data);
  return data;
}

export async function escopoLocal() {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error("Entre na sua conta antes de salvar fotos offline.");
  const companyId = navigator.onLine ? await empresaAtivaId() : sessionStorage.getItem(`previna-company:${userId}`);
  if (!companyId) throw new Error("Abra a empresa com conexão antes de usar fotos offline.");
  return { userId, companyId };
}

export async function caminhoEmpresa(userId: string, pasta: string) {
  return `companies/${await empresaAtivaId()}/${userId}/${pasta}`;
}