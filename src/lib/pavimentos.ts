import { supabase } from "@/integrations/supabase/client";

export type Pavimento = {
  id: string;
  obra_id: string;
  nome: string;
  ordem: number;
};

/** Pavimentos criados automaticamente na primeira vez que a obra é aberta. */
export const PAVIMENTOS_PADRAO = [
  "Térreo",
  "Garagem 01",
  "Garagem 02",
  "Garagem 03",
  "Lazer",
  "Diferenciado",
  "Tipo 01",
  "Tipo 02",
  "Tipo 03",
  "Tipo 04",
  "Tipo 05",
  "Tipo 06",
  "Tipo 07",
  "Tipo 08",
  "Tipo 09",
  "Tipo 10",
  "Casa de máquinas",
  "Caixa d'água",
];

export async function listarPavimentos(obraId: string) {
  const { data, error } = await supabase
    .from("pavimentos")
    .select("id, obra_id, nome, ordem")
    .eq("obra_id", obraId)
    .order("ordem", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Pavimento[];
}

/** Garante a lista padrão na primeira utilização da obra. */
export async function carregarPavimentos(obraId: string) {
  const atuais = await listarPavimentos(obraId);
  if (atuais.length > 0) return atuais;
  const { error } = await supabase
    .from("pavimentos")
    .insert(PAVIMENTOS_PADRAO.map((nome, ordem) => ({ obra_id: obraId, nome, ordem })));
  if (error) throw new Error(error.message);
  return await listarPavimentos(obraId);
}

export async function criarPavimento(obraId: string, nome: string, ordem: number) {
  const { error } = await supabase.from("pavimentos").insert({ obra_id: obraId, nome, ordem });
  if (error) throw new Error(error.message);
}

export async function renomearPavimento(id: string, nome: string) {
  const { error } = await supabase.from("pavimentos").update({ nome }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function excluirPavimento(id: string) {
  const { error } = await supabase.from("pavimentos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
