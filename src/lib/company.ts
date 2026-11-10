import { supabase } from "@/integrations/supabase/client";

export async function empresaAtivaId() {
  const { data, error } = await supabase.rpc("active_company_id");
  if (error || !data) throw new Error("Não foi possível identificar a empresa. Entre novamente.");
  return data;
}

export async function caminhoEmpresa(userId: string, pasta: string) {
  return `companies/${await empresaAtivaId()}/${userId}/${pasta}`;
}