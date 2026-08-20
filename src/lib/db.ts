import { supabase } from "@/integrations/supabase/client";

export type Obra = {
  id: string;
  nome: string;
  empresa: string | null;
  endereco: string | null;
  responsavel: string | null;
  status: string;
  data_criacao: string;
};

export type Inspecao = {
  id: string;
  numero: string;
  obra_id: string | null;
  data: string;
  horario: string | null;
  responsavel: string | null;
  local: string | null;
  tipo_inspecao: string | null;
  observacoes: string | null;
  status: string;
  data_criacao: string;
  obras?: { nome: string } | null;
};

export type NaoConformidade = {
  id: string;
  numero: string;
  inspecao_id: string | null;
  categoria: string | null;
  descricao: string;
  severidade: string;
  prazo: string | null;
  status: string;
  observacao: string | null;
  data_criacao: string;
  inspecoes?: { numero: string; data: string; obras?: { nome: string } | null } | null;
};

export type AcaoCorretiva = {
  id: string;
  numero: string;
  nao_conformidade_id: string;
  descricao: string;
  responsavel: string | null;
  prazo: string | null;
  status: string;
  data_conclusao: string | null;
  observacao: string | null;
  nao_conformidades?: { numero: string; descricao: string } | null;
};

export type Checklist = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  ativo: boolean;
  data_criacao: string;
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const listarObras = async () =>
  unwrap<Obra[]>(await supabase.from("obras").select("*").order("data_criacao", { ascending: false }));

export const listarInspecoes = async () =>
  unwrap<Inspecao[]>(
    await supabase
      .from("inspecoes")
      .select("*, obras(nome)")
      .order("data", { ascending: false })
      .order("data_criacao", { ascending: false }),
  );

export const obterInspecao = async (id: string) => {
  const { data, error } = await supabase
    .from("inspecoes")
    .select("*, obras(nome)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Inspecao | null;
};

export const listarNCs = async () =>
  unwrap<NaoConformidade[]>(
    await supabase
      .from("nao_conformidades")
      .select("*, inspecoes(numero, data, obras(nome))")
      .order("data_criacao", { ascending: false }),
  );

export const listarNCsDaInspecao = async (inspecaoId: string) =>
  unwrap<NaoConformidade[]>(
    await supabase
      .from("nao_conformidades")
      .select("*")
      .eq("inspecao_id", inspecaoId)
      .order("data_criacao", { ascending: true }),
  );

export const listarAcoes = async () =>
  unwrap<AcaoCorretiva[]>(
    await supabase
      .from("acoes_corretivas")
      .select("*, nao_conformidades(numero, descricao)")
      .order("data_criacao", { ascending: false }),
  );

export const listarChecklists = async () =>
  unwrap<Checklist[]>(
    await supabase.from("checklists").select("*").order("data_criacao", { ascending: false }),
  );

export const contar = async (tabela: "fotos_inspecao" | "nao_conformidades", coluna: string, valor: string) => {
  const { count, error } = await supabase
    .from(tabela)
    .select("id", { count: "exact", head: true })
    .eq(coluna, valor);
  if (error) throw new Error(error.message);
  return count ?? 0;
};

export const formatarData = (iso: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export const formatarHora = (h: string | null) => (h ? h.slice(0, 5) : "—");
