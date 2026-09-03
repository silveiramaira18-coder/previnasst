import { supabase } from "@/integrations/supabase/client";

export type Resposta = "Conforme" | "Não conforme" | "Não se aplica";

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
  risco_potencial: string | null;
  status: string;
  data_criacao: string;
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

export async function criarItem(inspecaoId: string, ordem: number, numero: number) {
  const { data, error } = await supabase
    .from("itens_inspecao")
    .insert({ inspecao_id: inspecaoId, ordem, numero, status: "Pendente" })
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

  const [{ count: fotosGerais }, { count: ncs }] = await Promise.all([
    supabase
      .from("fotos_inspecao")
      .select("id", { count: "exact", head: true })
      .eq("inspecao_id", inspecaoId),
    supabase
      .from("nao_conformidades")
      .select("id", { count: "exact", head: true })
      .eq("inspecao_id", inspecaoId),
  ]);

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
    ncs: ncs ?? 0,
  };
}
