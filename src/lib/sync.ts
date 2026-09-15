/**
 * Fila de sincronização offline: guarda as fotos tiradas sem internet no
 * próprio aparelho (IndexedDB) e envia sozinha quando a conexão volta.
 */
import { supabase } from "@/integrations/supabase/client";
import { BUCKET, type FotoTabela } from "@/lib/fotos";

const DB = "previna-sst-sync";
const STORE = "fotos-pendentes";

export type FotoPendente = {
  id: string;
  tabela: FotoTabela;
  coluna: string;
  valor: string;
  nome: string;
  tipo: string;
  blob: Blob;
  criadoEm: number;
};

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function transacao<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  return abrir().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, modo).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

const ouvintes = new Set<() => void>();
export function aoMudarFila(fn: () => void) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
const avisar = () => ouvintes.forEach((f) => f());

/** Compacta a foto para economizar espaço e dados móveis. */
export async function compactarFoto(arquivo: File, larguraMax = 1600, qualidade = 0.75) {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, larguraMax / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", qualidade),
    );
    if (!blob || blob.size >= arquivo.size) return arquivo;
    return new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return arquivo;
  }
}

export async function enfileirarFotos(
  tabela: FotoTabela,
  coluna: string,
  valor: string,
  arquivos: File[],
) {
  for (const arquivo of arquivos) {
    const comprimido = await compactarFoto(arquivo);
    const item: FotoPendente = {
      id: crypto.randomUUID(),
      tabela,
      coluna,
      valor,
      nome: arquivo.name,
      tipo: comprimido.type || "image/jpeg",
      blob: comprimido,
      criadoEm: Date.now(),
    };
    await transacao("readwrite", (s) => s.add(item));
  }
  avisar();
}

export async function listarPendentes(): Promise<FotoPendente[]> {
  try {
    const itens = await transacao<FotoPendente[]>("readonly", (s) => s.getAll() as never);
    return itens ?? [];
  } catch {
    return [];
  }
}

export async function contarPendentes() {
  return (await listarPendentes()).length;
}

let sincronizando = false;

/** Envia tudo que está na fila. Retorna quantas fotos foram enviadas. */
export async function sincronizarFila(): Promise<number> {
  if (sincronizando || typeof window === "undefined" || !navigator.onLine) return 0;
  sincronizando = true;
  let enviadas = 0;
  try {
    const pendentes = await listarPendentes();
    if (!pendentes.length) return 0;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return 0;

    for (const item of pendentes) {
      const ext = item.nome.split(".").pop() ?? "jpg";
      const caminho = `${userId}/${item.valor}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, item.blob, { contentType: item.tipo });
      if (upErr) continue;

      const { error: dbErr } = await supabase.from(item.tabela).insert({
        [item.coluna]: item.valor,
        url: caminho,
        nome_arquivo: item.nome,
        user_id: userId,
      } as never);
      if (dbErr) continue;

      await transacao("readwrite", (s) => s.delete(item.id));
      enviadas += 1;
    }
  } finally {
    sincronizando = false;
    avisar();
  }
  return enviadas;
}

/** Tenta sincronizar assim que a conexão voltar e periodicamente. */
export function iniciarSincronizacaoAutomatica() {
  if (typeof window === "undefined") return;
  void sincronizarFila();
  window.addEventListener("online", () => void sincronizarFila());
  window.setInterval(() => void sincronizarFila(), 60_000);
}
