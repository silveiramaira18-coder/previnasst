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
  company_id: string | null;
  nome_treinamento: string | null;
  horario_inicial: string | null;
  horario_final: string | null;
  modo_assinatura: "digital" | "manual";
  instrutor_nome: string | null;
  instrutor_cargo: string | null;
  instrutor_assinatura: string | null;
  instrutor_assinatura_data: string | null;
  created_at: string;
};

export type Participante = {
  id: string;
  lista_id: string;
  employee_id: string | null;
  ordem: number;
  nome: string;
  funcao: string | null;
  assinatura: string | null;
  assinatura_data: string | null;
};

export type NovaLista = {
  local: string;
  data: string;
  empresa: string;
  horario: string;
  carga_horaria: string;
  tema: string;
  nome_treinamento: string;
  horario_inicial: string;
  horario_final: string;
  modo_assinatura: "digital" | "manual";
  instrutor_nome: string;
  instrutor_cargo: string;
};

export type NovoParticipante = {
  id?: string;
  nome: string;
  funcao: string;
  employee_id?: string | null;
};

export async function listarListas(): Promise<ListaPresenca[]> {
  const { data, error } = await supabase
    .from("listas_presenca")
    .select("*");
  if (error) throw new Error(error.message);
  return ((data ?? []) as ListaPresenca[]).sort((a, b) => ordenarAZ(a.nome_treinamento ?? a.tema, b.nome_treinamento ?? b.tema));
}

export async function listarParticipantes(listaId: string): Promise<Participante[]> {
  const { data, error } = await supabase
    .from("lista_presenca_participantes")
    .select("id, lista_id, employee_id, ordem, nome, funcao, assinatura, assinatura_data")
    .eq("lista_id", listaId)
    .order("ordem");
  if (error) throw new Error(error.message);
  return ordenarParticipantes((data ?? []) as Participante[]);
}

export async function criarLista(dados: NovaLista, participantes: NovoParticipante[]): Promise<string> {
  return salvarLista(null, dados, participantes);
}

export async function salvarLista(id: string | null, dados: NovaLista, participantes: NovoParticipante[]): Promise<string> {
  const { data, error } = await supabase.rpc("salvar_lista_treinamento", {
    ...(id ? { p_id: id } : { p_id: null as unknown as string }),
    p_dados: { ...dados },
    p_participantes: ordenarParticipantes(participantes).map((p, i) => ({ ...p, ordem: i + 1 })),
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function salvarAssinatura(id: string, imagem: string) {
  if (!/^data:image\/png;base64,/.test(imagem) || imagem.length > 800_000) throw new Error("Assinatura inválida.");
  const { error } = await supabase.from("lista_presenca_participantes").update({ assinatura: imagem, assinatura_data: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function salvarAssinaturaInstrutor(id: string, imagem: string) {
  if (!/^data:image\/png;base64,/.test(imagem) || imagem.length > 800_000) throw new Error("Assinatura inválida.");
  const { error } = await supabase.from("listas_presenca").update({ instrutor_assinatura: imagem, instrutor_assinatura_data: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function alterarModoAssinatura(id: string, modo: "digital" | "manual") {
  const { error } = await supabase.from("listas_presenca").update({ modo_assinatura: modo }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function excluirLista(id: string) {
  const { error } = await supabase.from("listas_presenca").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function ordenarParticipantes<T extends { nome: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => ordenarAZ(a.nome, b.nome));
}
