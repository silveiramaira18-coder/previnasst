import { supabase } from "@/integrations/supabase/client";
import { hojeISO, ncConcluida, ncVencida, type NaoConformidade } from "@/lib/db";

/* ---------------- Plano de ação (Kanban) ---------------- */

export const STATUS_VALIDACAO = "Aguardando validação";

export const COLUNAS_V2 = [
  { chave: "aberto", titulo: "Aberto", status: "Aberta" },
  { chave: "tratativa", titulo: "Em tratativa", status: "Em andamento" },
  { chave: "validacao", titulo: "Aguardando validação", status: STATUS_VALIDACAO },
  { chave: "concluido", titulo: "Concluído", status: "Concluída" },
] as const;

export type ColunaV2 = (typeof COLUNAS_V2)[number]["chave"];

export type PlanoAcao = NaoConformidade & {
  itens_inspecao?: { local: string | null; normas_regulamentadoras: string[] | null } | null;
  obras?: { nome: string } | null;
};

export const colunaDaNC = (nc: { status: string }): ColunaV2 =>
  ncConcluida(nc)
    ? "concluido"
    : nc.status === STATUS_VALIDACAO
      ? "validacao"
      : nc.status === "Em andamento"
        ? "tratativa"
        : "aberto";

export const statusDaColuna = (coluna: ColunaV2) =>
  COLUNAS_V2.find((c) => c.chave === coluna)!.status;

export async function listarPlanosAcao(): Promise<PlanoAcao[]> {
  const { data, error } = await supabase
    .from("nao_conformidades")
    .select(
      "*, obras(nome), itens_inspecao(local, normas_regulamentadoras), inspecoes(numero, data, obras(nome))",
    )
    .order("data_criacao", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PlanoAcao[];
}

export async function moverPlano(id: string, coluna: ColunaV2) {
  const status = statusDaColuna(coluna);
  const { error } = await supabase
    .from("nao_conformidades")
    .update({
      status,
      data_conclusao: coluna === "concluido" ? hojeISO() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Matriz GUT: gravidade x urgência x tendência (1 a 5). */
export const calcularGUT = (g: number, u: number, t: number) => g * u * t;

export async function salvarGUT(id: string, g: number, u: number, t: number) {
  const { error } = await supabase
    .from("nao_conformidades")
    .update({
      gut_gravidade: g,
      gut_urgencia: u,
      gut_tendencia: t,
      gut_score: calcularGUT(g, u, t),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Dashboard de BI / tendências ---------------- */

export type IndicadoresV2 = {
  conformidade: number;
  itensAvaliados: number;
  porSeveridade: { nome: string; total: number }[];
  rankingNRs: { nr: string; total: number }[];
  mttr: number | null;
  resolvidas: number;
  abertas: number;
  atrasadas: number;
  porMes: { mes: string; abertas: number; resolvidas: number }[];
};

const rotuloMes = (iso: string) => {
  const [ano, mes] = iso.slice(0, 7).split("-");
  return `${mes}/${(ano ?? "").slice(2)}`;
};

export async function carregarIndicadoresV2(): Promise<IndicadoresV2> {
  const [ncsRes, itensRes] = await Promise.all([
    supabase
      .from("nao_conformidades")
      .select("status, severidade, prazo, data_criacao, data_conclusao, item_inspecao_id"),
    supabase.from("itens_inspecao").select("id, resposta, normas_regulamentadoras"),
  ]);
  if (ncsRes.error) throw new Error(ncsRes.error.message);
  if (itensRes.error) throw new Error(itensRes.error.message);

  const ncs = (ncsRes.data ?? []) as {
    status: string;
    severidade: string;
    prazo: string | null;
    data_criacao: string;
    data_conclusao: string | null;
    item_inspecao_id: string | null;
  }[];
  const itens = (itensRes.data ?? []) as {
    id: string;
    resposta: string | null;
    normas_regulamentadoras: string[] | null;
  }[];

  const conformes = itens.filter((i) => i.resposta === "Conforme").length;
  const naoConformes = itens.filter((i) => i.resposta === "Não conforme").length;
  const avaliados = conformes + naoConformes;

  const severidades = ["Crítico", "Médio", "Baixo"];
  const porSeveridade = severidades.map((nome) => ({
    nome,
    total: ncs.filter((n) => (n.severidade ?? "").toLowerCase() === nome.toLowerCase()).length,
  }));

  const itensComNC = new Set(ncs.map((n) => n.item_inspecao_id).filter(Boolean) as string[]);
  const contagemNR = new Map<string, number>();
  for (const item of itens) {
    if (!itensComNC.has(item.id)) continue;
    for (const nr of item.normas_regulamentadoras ?? []) {
      contagemNR.set(nr, (contagemNR.get(nr) ?? 0) + 1);
    }
  }
  const rankingNRs = [...contagemNR.entries()]
    .map(([nr, total]) => ({ nr, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const concluidas = ncs.filter((n) => ncConcluida(n) && !!n.data_conclusao);
  const dias = concluidas.map(
    (n) =>
      (Date.parse(`${n.data_conclusao!.slice(0, 10)}T00:00:00Z`) -
        Date.parse(`${n.data_criacao.slice(0, 10)}T00:00:00Z`)) /
      86_400_000,
  );
  const mttr = dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : null;

  const meses = new Map<string, { abertas: number; resolvidas: number }>();
  const registrar = (iso: string, campo: "abertas" | "resolvidas") => {
    const chave = iso.slice(0, 7);
    const atual = meses.get(chave) ?? { abertas: 0, resolvidas: 0 };
    atual[campo] += 1;
    meses.set(chave, atual);
  };
  for (const n of ncs) {
    registrar(n.data_criacao, "abertas");
    if (n.data_conclusao) registrar(n.data_conclusao, "resolvidas");
  }
  const porMes = [...meses.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mes, v]) => ({ mes: rotuloMes(mes), ...v }));

  return {
    conformidade: avaliados > 0 ? Math.round((conformes / avaliados) * 100) : 0,
    itensAvaliados: avaliados,
    porSeveridade,
    rankingNRs,
    mttr,
    resolvidas: concluidas.length,
    abertas: ncs.filter((n) => !ncConcluida(n)).length,
    atrasadas: ncs.filter((n) => ncVencida(n)).length,
    porMes,
  };
}
