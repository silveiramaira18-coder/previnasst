import { supabase } from "@/integrations/supabase/client";

export type Obra = {
  id: string;
  user_id?: string | null;
  nome: string;
  empresa: string | null;
  endereco: string | null;
  responsavel: string | null;
  engenheiro_responsavel?: string | null;
  email_engenheiro?: string | null;
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

/** Extrai os e-mails informados nas tags de responsáveis ("Nome (Cargo) <email>"). */
export const emailsDosResponsaveis = (responsaveis: string[] | null | undefined) =>
  Array.from(
    new Set(
      (responsaveis ?? [])
        .map((r) => r.match(/<([^>]+)>/)?.[1]?.trim().toLowerCase())
        .filter((e): e is string => !!e),
    ),
  );

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

/** Status gravado quando há ação imediata mas a medida definitiva segue pendente. */
export const STATUS_PARCIAL = "Parcialmente Concluída";

/** Status exibido: "Vencida" quando o prazo expirou e a NC continua aberta. */
export const statusExibidoNC = (nc: { status: string; prazo: string | null }) =>
  ncVencida(nc) ? "Vencida" : nc.status === "Em andamento" ? STATUS_PARCIAL : nc.status;

/** Diferença em dias entre o prazo e hoje (negativo = atrasado). */
export const diasAtePrazo = (prazo: string | null) => {
  if (!prazo) return null;
  const um = 86_400_000;
  const a = Date.parse(`${prazo.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${hojeISO()}T00:00:00Z`);
  return Math.round((a - b) / um);
};

export type AlertaPrazo = { tom: "vencida" | "hoje" | "prazo"; texto: string };

/** Texto de alerta do prazo para telas e PDF. */
export const alertaPrazo = (nc: {
  status: string;
  prazo: string | null;
}): AlertaPrazo | null => {
  if (nc.status === "Concluída" || !nc.prazo) return null;
  const dias = diasAtePrazo(nc.prazo);
  if (dias === null) return null;
  if (dias < 0) {
    const d = Math.abs(dias);
    return { tom: "vencida", texto: `Vencida há ${d} ${d === 1 ? "dia" : "dias"}` };
  }
  if (dias === 0) return { tom: "hoje", texto: "Vence hoje" };
  return { tom: "prazo", texto: `Faltam ${dias} ${dias === 1 ? "dia" : "dias"} para o prazo` };
};

/**
 * Alerta de prazo em destaque, calculado sempre em relação à data de hoje
 * (data de emissão do relatório). Use emoji apenas nas telas — o PDF não renderiza emojis.
 */
export const alertaPrazoDestaque = (
  nc: { status: string; prazo: string | null },
  comEmoji = false,
): AlertaPrazo | null => {
  if (nc.status === "Concluída" || !nc.prazo) return null;
  const dias = diasAtePrazo(nc.prazo);
  if (dias === null) return null;
  if (dias < 0) {
    const d = Math.abs(dias);
    return {
      tom: "vencida",
      texto: `${comEmoji ? "🚨 " : ""}ATRASADA HÁ ${d} ${d === 1 ? "DIA" : "DIAS"}`,
    };
  }
  if (dias === 0) return { tom: "hoje", texto: `${comEmoji ? "⚠️ " : ""}VENCE HOJE` };
  return {
    tom: "prazo",
    texto: `${comEmoji ? "⏳ " : ""}VENCE EM ${dias} ${dias === 1 ? "DIA" : "DIAS"}`,
  };
};

/** NCs de uma obra que continuam pendentes (para acompanhamento em novos relatórios). */
export const listarNCsPendentesDaObra = async (obraId: string, excetoInspecaoId?: string) => {
  const { data, error } = await supabase
    .from("nao_conformidades")
    .select("*, inspecoes(numero, data, obras(nome))")
    .eq("obra_id", obraId)
    .neq("status", "Concluída")
    .order("prazo", { ascending: true });
  if (error) throw new Error(error.message);
  const lista = (data ?? []) as NaoConformidade[];
  return excetoInspecaoId ? lista.filter((n) => n.inspecao_id !== excetoInspecaoId) : lista;
};



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
