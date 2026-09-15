import { supabase } from "@/integrations/supabase/client";
import { ncVencida } from "@/lib/db";

export type Resposta = "Conforme" | "Não conforme" | "Não se aplica";

export type NormaRegulamentadora = { value: string; label: string };

export const NORMAS_REGULAMENTADORAS: NormaRegulamentadora[] = [
  { value: "NR-1", label: "NR-1 - DISPOSIÇÕES GERAIS E GERENCIAMENTO DE RISCOS OCUPACIONAIS" },
  { value: "NR-2", label: "NR-2 - INSPEÇÃO PRÉVIA (REVOGADA)" },
  { value: "NR-3", label: "NR-3 - EMBARGO E INTERDIÇÃO" },
  { value: "NR-4", label: "NR-4 - SERVIÇOS ESPECIALIZADOS EM SEGURANÇA E EM MEDICINA DO TRABALHO" },
  { value: "NR-5", label: "NR-5 - COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES" },
  { value: "NR-6", label: "NR-6 - EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL - EPI" },
  { value: "NR-7", label: "NR-7 - PROGRAMA DE CONTROLE MÉDICO DE SAÚDE OCUPACIONAL" },
  { value: "NR-8", label: "NR-8 - EDIFICAÇÕES" },
  { value: "NR-9", label: "NR-9 - AVALIAÇÃO E CONTROLE DAS EXPOSIÇÕES OCUPACIONAIS A AGENTES FÍSICOS, QUÍMICOS E BIOLÓGICOS" },
  { value: "NR-10", label: "NR-10 - SEGURANÇA EM INSTALAÇÕES E SERVIÇOS EM ELETRICIDADE" },
  { value: "NR-11", label: "NR-11 - TRANSPORTE, MOVIMENTAÇÃO, ARMAZENAGEM E MANUSEIO DE MATERIAIS" },
  { value: "NR-12", label: "NR-12 - SEGURANÇA NO TRABALHO EM MÁQUINAS E EQUIPAMENTOS" },
  { value: "NR-13", label: "NR-13 - CALDEIRAS, VASOS DE PRESSÃO E TUBULAÇÕES E TANQUES METÁLICOS DE ARMAZENAMENTO" },
  { value: "NR-14", label: "NR-14 - FORNOS" },
  { value: "NR-15", label: "NR-15 - ATIVIDADES E OPERAÇÕES INSALUBRES" },
  { value: "NR-16", label: "NR-16 - ATIVIDADES E OPERAÇÕES PERIGOSAS" },
  { value: "NR-17", label: "NR-17 - ERGONOMIA" },
  { value: "NR-18", label: "NR-18 - SEGURANÇA E SAÚDE NO TRABALHO NA INDÚSTRIA DA CONSTRUÇÃO" },
  { value: "NR-19", label: "NR-19 - EXPLOSIVOS" },
  { value: "NR-20", label: "NR-20 - SEGURANÇA E SAÚDE NO TRABALHO COM INFLAMÁVEIS E COMBUSTÍVEIS" },
  { value: "NR-21", label: "NR-21 - TRABALHOS A CÉU ABERTO" },
  { value: "NR-22", label: "NR-22 - SEGURANÇA E SAÚDE OCUPACIONAL NA MINERAÇÃO" },
  { value: "NR-23", label: "NR-23 - PROTEÇÃO CONTRA INCÊNDIOS" },
  { value: "NR-24", label: "NR-24 - CONDIÇÕES SANITÁRIAS E DE CONFORTO NOS LOCAIS DE TRABALHO" },
  { value: "NR-25", label: "NR-25 - RESÍDUOS INDUSTRIAIS" },
  { value: "NR-26", label: "NR-26 - SINALIZAÇÃO DE SEGURANÇA" },
  { value: "NR-27", label: "NR-27 - REGISTRO PROFISSIONAL DO TÉCNICO DE SEGURANÇA DO TRABALHO (REVOGADA)" },
  { value: "NR-28", label: "NR-28 - FISCALIZAÇÃO E PENALIDADES" },
  { value: "NR-29", label: "NR-29 - NORMA REGULAMENTADORA DE SEGURANÇA E SAÚDE NO TRABALHO PORTUÁRIO" },
  { value: "NR-30", label: "NR-30 - SEGURANÇA E SAÚDE NO TRABALHO AQUAVIÁRIO" },
  { value: "NR-31", label: "NR-31 - SEGURANÇA E SAÚDE NO TRABALHO NA AGRICULTURA, PECUÁRIA SILVICULTURA, EXPLORAÇÃO FLORESTAL E AQUICULTURA" },
  { value: "NR-32", label: "NR-32 - SEGURANÇA E SAÚDE NO TRABALHO EM SERVIÇOS DE SAÚDE" },
  { value: "NR-33", label: "NR-33 - SEGURANÇA E SAÚDE NOS TRABALHOS EM ESPAÇOS CONFINADOS" },
  { value: "NR-34", label: "NR-34 - CONDIÇÕES E MEIO AMBIENTE DE TRABALHO NA INDÚSTRIA DA CONSTRUÇÃO, REPARAÇÃO E DESMONTE NAVAL" },
  { value: "NR-35", label: "NR-35 - TRABALHO EM ALTURA" },
  { value: "NR-36", label: "NR-36 - SEGURANÇA E SAÚDE NO TRABALHO EM EMPRESAS DE ABATE E PROCESSAMENTO DE CARNES E DERIVADOS" },
  { value: "NR-37", label: "NR-37 - SEGURANÇA E SAÚDE EM PLATAFORMAS DE PETRÓLEO" },
  { value: "NR-38", label: "NR-38 - SEGURANÇA E SAÚDE NO TRABALHO NAS ATIVIDADES DE LIMPEZA URBANA E MANEJO DE RESÍDUOS SÓLIDOS" },
];

/** @deprecated Use NORMAS_REGULAMENTADORAS para a lista completa. */
export const NORMAS_COMUNS = ["NR-06", "NR-12", "NR-18", "NR-35"];

export const RESPOSTAS: Resposta[] = ["Conforme", "Não conforme", "Não se aplica"];

export type ItemInspecao = {
  id: string;
  inspecao_id: string;
  numero: number;
  ordem: number;
  categoria: string | null;
  local: string | null;
  pergunta: string | null;
  resposta: string | null;
  observacao: string | null;
  norma_regulamentadora: string | null;
  normas_regulamentadoras: string[];
  risco_potencial: string | null;
  status: string;
  data_criacao: string;
};

/** Lista de NRs do item (compatível com registros antigos de NR única). */
export const normasDoItem = (item: {
  normas_regulamentadoras?: string[] | null;
  norma_regulamentadora?: string | null;
}) => {
  const lista = item.normas_regulamentadoras ?? [];
  if (lista.length > 0) return lista;
  return item.norma_regulamentadora ? [item.norma_regulamentadora] : [];
};

export async function listarItens(inspecaoId: string) {
  const { data, error } = await supabase
    .from("itens_inspecao")
    .select("*")
    .eq("inspecao_id", inspecaoId)
    .order("ordem", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ItemInspecao[];
}

export async function criarItem(
  inspecaoId: string,
  ordem: number,
  numero: number,
  local?: string | null,
) {
  const { data, error } = await supabase
    .from("itens_inspecao")
    .insert({ inspecao_id: inspecaoId, ordem, numero, status: "Pendente", local: local || null })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ItemInspecao;
}

export async function atualizarItem(id: string, campos: Partial<ItemInspecao>) {
  const { error } = await supabase.from("itens_inspecao").update(campos).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function excluirItem(id: string) {
  const { error } = await supabase.from("itens_inspecao").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Reordena os itens gravando ordem e número sequencial (1..n). */
export async function reordenarItens(itens: ItemInspecao[]) {
  await Promise.all(
    itens.map((item, idx) =>
      supabase
        .from("itens_inspecao")
        .update({ ordem: idx, numero: idx + 1 })
        .eq("id", item.id),
    ),
  );
}

export const statusDaResposta = (resposta: string | null) => {
  if (resposta === "Conforme") return "Conforme";
  if (resposta === "Não conforme") return "Não conforme";
  if (resposta === "Não se aplica") return "Não se aplica";
  return "Pendente";
};

export type ResumoInspecao = {
  total: number;
  conformes: number;
  naoConformes: number;
  naoAplicaveis: number;
  pendentes: number;
  conformidade: number;
  fotos: number;
  ncs: number;
  ncsAtrasadas: number;
  ncsAVencer: number;
};

export async function resumoInspecao(inspecaoId: string): Promise<ResumoInspecao> {
  const itens = await listarItens(inspecaoId);
  const ids = itens.map((i) => i.id);

  let fotosItens = 0;
  if (ids.length > 0) {
    const { count, error } = await supabase
      .from("fotos_item_inspecao")
      .select("id", { count: "exact", head: true })
      .in("item_inspecao_id", ids);
    if (error) throw new Error(error.message);
    fotosItens = count ?? 0;
  }

  const [{ count: fotosGerais }, { data: ncsLista }] = await Promise.all([
    supabase
      .from("fotos_inspecao")
      .select("id", { count: "exact", head: true })
      .eq("inspecao_id", inspecaoId),
    supabase
      .from("nao_conformidades")
      .select("id, status, prazo")
      .eq("inspecao_id", inspecaoId),
  ]);

  const ncsDaInspecao = ncsLista ?? [];
  // Atrasadas: prazo já vencido. A vencer: pendentes ainda dentro do prazo.
  const ncsAtrasadas = ncsDaInspecao.filter((n) => ncVencida(n)).length;
  const ncsAVencer = ncsDaInspecao.filter(
    (n) => n.status !== "Concluída" && !ncVencida(n),
  ).length;

  const conformes = itens.filter((i) => i.resposta === "Conforme").length;
  const naoConformes = itens.filter((i) => i.resposta === "Não conforme").length;
  const naoAplicaveis = itens.filter((i) => i.resposta === "Não se aplica").length;
  const avaliados = conformes + naoConformes;

  return {
    total: itens.length,
    conformes,
    naoConformes,
    naoAplicaveis,
    pendentes: itens.length - conformes - naoConformes - naoAplicaveis,
    conformidade: avaliados > 0 ? (conformes / avaliados) * 100 : 0,
    fotos: fotosItens + (fotosGerais ?? 0),
    ncs: ncsDaInspecao.length,
    ncsAtrasadas,
    ncsAVencer,
  };
}
