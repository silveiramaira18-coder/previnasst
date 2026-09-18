import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "fotos";

export type FotoTabela =
  | "fotos_inspecao"
  | "fotos_item_inspecao"
  | "fotos_nao_conformidade"
  | "fotos_acao_corretiva";

export type Foto = {
  id: string;
  url: string;
  nome_arquivo: string | null;
  descricao: string | null;
  data_upload: string;
};

/** "problema" = registro original da NC; "solucao" = evidência da correção. */
export type TipoFoto = "problema" | "solucao";

export async function listarFotos(
  tabela: FotoTabela,
  coluna: string,
  valor: string,
  tipo?: TipoFoto,
) {
  const base = supabase
    .from(tabela)
    .select("id, url, nome_arquivo, descricao, data_upload")
    .eq(coluna, valor);
  const consulta =
    tipo && tabela === "fotos_nao_conformidade"
      ? supabase
          .from("fotos_nao_conformidade")
          .select("id, url, nome_arquivo, descricao, data_upload")
          .eq(coluna, valor)
          .eq("tipo", tipo)
      : base;
  const { data, error } = await consulta.order("data_upload", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Foto[];
}

export async function enviarFotos(
  tabela: FotoTabela,
  coluna: string,
  valor: string,
  arquivos: File[],
  tipo?: TipoFoto,
) {
  // Sem internet: guarda as fotos no aparelho e envia sozinho depois.
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const { enfileirarFotos } = await import("@/lib/sync");
    await enfileirarFotos(tabela, coluna, valor, arquivos);
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Sessão expirada. Entre novamente.");

  for (const arquivo of arquivos) {
    const ext = arquivo.name.split(".").pop() ?? "jpg";
    const caminho = `${userId}/${valor}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(caminho, arquivo, { contentType: arquivo.type || "image/jpeg" });
    if (upErr) throw upErr;

    const { error: dbErr } = await supabase
      .from(tabela)
      .insert({
        [coluna]: valor,
        url: caminho,
        nome_arquivo: arquivo.name,
        user_id: userId,
        ...(tipo && tabela === "fotos_nao_conformidade" ? { tipo } : {}),
      } as never);
    if (dbErr) throw dbErr;
  }
}

export async function excluirFoto(tabela: FotoTabela, id: string, caminho: string) {
  await supabase.storage.from(BUCKET).remove([caminho]);
  const { error } = await supabase.from(tabela).delete().eq("id", id);
  if (error) throw error;
}

export async function salvarDescricao(tabela: FotoTabela, id: string, descricao: string) {
  const { error } = await supabase.from(tabela).update({ descricao }).eq("id", id);
  if (error) throw error;
}

export async function urlAssinada(caminho: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 3600);
  if (error) throw error;
  return data.signedUrl;
}
