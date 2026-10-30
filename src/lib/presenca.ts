import { supabase } from "@/integrations/supabase/client";
import { ordenarAZ } from "@/lib/ged";

export type ListaPresenca = {
  id: string;
  user_id: string;
  local: string | null;
  data: string | null;
  empresa: string | null;
  horario: string | null;
  carga_horaria: string | null;
  tema: string;
  created_at: string;
};

export type Participante = {
  id: string;
  lista_id: string;
  employee_id: string | null;
  ordem: number;
  nome: string;
  funcao: string | null;
};

export type NovaLista = {
  local: string;
  data: string;
  empresa: string;
  horario: string;
  carga_horaria: string;
  tema: string;
};

export type NovoParticipante = {
  nome: string;
  funcao: string;
  employee_id?: string | null;
};

export async function listarListas(): Promise<ListaPresenca[]> {
  const { data, error } = await supabase
    .from("listas_presenca")
    .select("id, user_id, local, data, empresa, horario, carga_horaria, tema, created_at")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ListaPresenca[];
}

export async function listarParticipantes(listaId: string): Promise<Participante[]> {
  const { data, error } = await supabase
    .from("lista_presenca_participantes")
    .select("id, lista_id, employee_id, ordem, nome, funcao")
    .eq("lista_id", listaId)
    .order("ordem");
  if (error) throw new Error(error.message);
  return (data ?? []) as Participante[];
}

export async function criarLista(dados: NovaLista, participantes: NovoParticipante[]): Promise<string> {
  const { data: sessao } = await supabase.auth.getUser();
  const userId = sessao.user?.id;
  if (!userId) throw new Error("Sessão expirada. Entre novamente.");

  const { data: lista, error } = await supabase
    .from("listas_presenca")
    .insert({
      user_id: userId,
      local: dados.local.trim() || null,
      data: dados.data || null,
      empresa: dados.empresa.trim().toUpperCase() || null,
      horario: dados.horario.trim() || null,
      carga_horaria: dados.carga_horaria.trim() || null,
      tema: dados.tema.trim().toUpperCase(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (participantes.length > 0) {
    const linhas = participantes.map((p, i) => ({
      lista_id: lista.id,
      user_id: userId,
      employee_id: p.employee_id ?? null,
      ordem: i + 1,
      nome: p.nome.trim().toUpperCase(),
      funcao: p.funcao.trim().toUpperCase() || null,
    }));
    const { error: erroPart } = await supabase.from("lista_presenca_participantes").insert(linhas);
    if (erroPart) throw new Error(erroPart.message);
  }
  return lista.id as string;
}

export async function excluirLista(id: string) {
  const { error } = await supabase.from("listas_presenca").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function ordenarParticipantes<T extends { nome: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => ordenarAZ(a.nome, b.nome));
}
