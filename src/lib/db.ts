import { supabase } from "@/integrations/supabase/client";

export type Obra = {
  id: string;
  nome: string;
  empresa: string | null;
  endereco: string | null;
  responsavel: string | null;
  engenheiro_responsavel?: string | null;
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
  engenheiro_responsavel?: string | null;
  local: string | null;
  tipo_inspecao: string | null;
  observacoes: string | null;
  status: string;
  data_criacao: string;
  obras?: { nome: string; engenheiro_responsavel?: string | null } | null;
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
  item_inspecao_id?: string | null;
  obra_id?: string | null;
  responsavel?: string | null;
  responsaveis?: string[] | null;
  data_conclusao?: string | null;
  acao_imediata?: boolean | null;
  descricao_acao_imediata?: string | null;
  data_acao_imediata?: string | null;
  inspecoes?: { numero: string; data: string; obras?: { nome: string } | null } | null;
};

/** Risco imediato sanado, mas plano de ação definitivo ainda pendente. */
export const riscoNeutralizado = (nc: { status: string; acao_imediata?: boolean | null }) =>
  !!nc.acao_imediata && nc.status !== "Concluída";

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
    .select("*, obras(nome, engenheiro_responsavel)")
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

export const hojeISO = () => new Date().toISOString().slice(0, 10);

/** NC aberta com prazo anterior a hoje. */
export const ncVencida = (nc: { status: string; prazo: string | null }) =>
  nc.status !== "Concluída" && !!nc.prazo && nc.prazo < hojeISO();

/** Status exibido: "Vencida" quando o prazo expirou e a NC continua aberta. */
export const statusExibidoNC = (nc: { status: string; prazo: string | null }) =>
  ncVencida(nc) ? "Vencida" : nc.status;


/* ---------- Indicadores do dashboard (respeitam as regras de acesso do banco) ---------- */

export type Indicadores = {
  obras: number;
  inspecoes: number;
  naoConformidades: number;
  ncsAbertas: number;
  acoes: number;
  acoesAbertas: number;
  acoesAtrasadas: number;
  conformes: number;
  naoConformes: number;
  pendentes: number;
  conformidade: number;
};

const contarTabela = async (tabela: string) => {
  const { count, error } = await supabase
    .from(tabela as "obras")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
};

export async function carregarIndicadores(): Promise<Indicadores> {
  const hoje = hojeISO();

  const [obras, inspecoes, acoes, listaNcs, itens] = await Promise.all([
    contarTabela("obras"),
    contarTabela("inspecoes"),
    contarTabela("acoes_corretivas"),
    supabase.from("nao_conformidades").select("status, prazo"),
    supabase.from("itens_inspecao").select("resposta"),
  ]);

  const ncs = (listaNcs.data ?? []) as { status: string; prazo: string | null }[];
  const ncsConcluidas = ncs.filter((n) => n.status === "Concluída").length;
  const abertas = ncs.filter((n) => n.status !== "Concluída");
  const vencidas = abertas.filter((n) => !!n.prazo && n.prazo < hoje).length;
  const abertasNoPrazo = abertas.length - vencidas;

  const lista = (itens.data ?? []) as { resposta: string | null }[];
  const itensConformes = lista.filter((i) => i.resposta === "Conforme").length;

  // Conformidade considera itens conformes + NCs já tratadas frente às NCs em aberto.
  const conformes = itensConformes + ncsConcluidas;
  const naoConformes = abertas.length;
  const avaliados = conformes + naoConformes;

  return {
    obras,
    inspecoes,
    naoConformidades: abertas.length,
    ncsAbertas: abertas.length,
    acoes,
    acoesAbertas: abertasNoPrazo,
    acoesAtrasadas: vencidas,
    conformes,
    naoConformes,
    pendentes: abertasNoPrazo,
    conformidade: avaliados > 0 ? Math.round((conformes / avaliados) * 100) : 0,
  };
}


export type ResumoUsuario = {
  user_id: string;
  nome: string;
  empresa: string | null;
  cargo: string | null;
  obras: number;
  inspecoes: number;
  ncs: number;
  acoes: number;
};

/** Visão por usuário — só retorna dados completos para a administradora principal. */
export async function carregarResumoPorUsuario(): Promise<ResumoUsuario[]> {
  const [perfis, obras, inspecoes, ncs, acoes] = await Promise.all([
    supabase.from("profiles").select("id, nome, empresa, cargo"),
    supabase.from("obras").select("user_id"),
    supabase.from("inspecoes").select("user_id"),
    supabase.from("nao_conformidades").select("user_id"),
    supabase.from("acoes_corretivas").select("user_id"),
  ]);

  const contarPor = (linhas: { user_id: string }[] | null, id: string) =>
    (linhas ?? []).filter((l) => l.user_id === id).length;

  return ((perfis.data ?? []) as { id: string; nome: string | null; empresa: string | null; cargo: string | null }[])
    .map((p) => ({
      user_id: p.id,
      nome: p.nome || "Usuário sem nome",
      empresa: p.empresa,
      cargo: p.cargo,
      obras: contarPor(obras.data as { user_id: string }[] | null, p.id),
      inspecoes: contarPor(inspecoes.data as { user_id: string }[] | null, p.id),
      ncs: contarPor(ncs.data as { user_id: string }[] | null, p.id),
      acoes: contarPor(acoes.data as { user_id: string }[] | null, p.id),
    }))
    .sort((a, b) => b.inspecoes - a.inspecoes);
}
