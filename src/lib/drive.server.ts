const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";

export const PASTA_USUARIOS = "1ecMNXbxiI_Y_CCT24AvYNIGHGOSJVV_-";
export const PASTA_RELATORIOS = "1z5nHEK40Y0mB0FnycAcLM3ztkJBn1FdN";
export const ARQUIVO_USUARIOS = "usuarios-previna-sst.csv";

function headers() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const conexao = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!lovable || !conexao) throw new Error("Google Drive não está conectado neste projeto.");
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": conexao,
  };
}

async function driveFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    const corpo = await res.text();
    console.error(`Google Drive falhou [${res.status}]: ${corpo}`);
    throw new Error(`Google Drive falhou [${res.status}]: ${corpo}`);
  }
  return res;
}

function escapar(valor: string) {
  return valor.replace(/'/g, "\\'");
}

/** Procura (ou cria) uma subpasta pelo nome dentro de uma pasta pai. */
export async function garantirPasta(nome: string, paiId: string): Promise<string> {
  const q = `name='${escapar(nome)}' and '${paiId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const busca = await driveFetch(
    `/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent("files(id,name)")}&pageSize=1`,
  );
  const dados = (await busca.json()) as { files?: Array<{ id: string }> };
  const existente = dados.files?.[0]?.id;
  if (existente) return existente;

  const criada = await driveFetch(`/drive/v3/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nome,
      mimeType: "application/vnd.google-apps.folder",
      parents: [paiId],
    }),
  });
  const nova = (await criada.json()) as { id: string };
  return nova.id;
}

export async function buscarArquivo(nome: string, paiId: string): Promise<string | null> {
  const q = `name='${escapar(nome)}' and '${paiId}' in parents and trashed=false`;
  const res = await driveFetch(
    `/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent("files(id,name)")}&pageSize=1`,
  );
  const dados = (await res.json()) as { files?: Array<{ id: string }> };
  return dados.files?.[0]?.id ?? null;
}

function multipart(metadata: unknown, conteudo: Uint8Array, contentType: string) {
  const limite = `previna-${crypto.randomUUID()}`;
  const enc = new TextEncoder();
  const inicio = enc.encode(
    `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${limite}\r\nContent-Type: ${contentType}\r\n\r\n`,
  );
  const fim = enc.encode(`\r\n--${limite}--`);
  const corpo = new Uint8Array(inicio.length + conteudo.length + fim.length);
  corpo.set(inicio, 0);
  corpo.set(conteudo, inicio.length);
  corpo.set(fim, inicio.length + conteudo.length);
  return { corpo, contentType: `multipart/related; boundary=${limite}` };
}

/** Cria ou atualiza um arquivo dentro de uma pasta. */
export async function enviarArquivo(opcoes: {
  nome: string;
  pastaId: string;
  conteudo: Uint8Array;
  contentType: string;
  substituirId?: string | null;
}): Promise<{ id: string; link: string }> {
  const metadata = opcoes.substituirId
    ? { name: opcoes.nome }
    : { name: opcoes.nome, parents: [opcoes.pastaId] };
  const { corpo, contentType } = multipart(metadata, opcoes.conteudo, opcoes.contentType);
  const caminho = opcoes.substituirId
    ? `/upload/drive/v3/files/${opcoes.substituirId}?uploadType=multipart&fields=id,webViewLink`
    : `/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink`;
  const res = await driveFetch(caminho, {
    method: opcoes.substituirId ? "PATCH" : "POST",
    headers: { "Content-Type": contentType },
    body: corpo,
  });
  const dados = (await res.json()) as { id: string; webViewLink?: string };
  return { id: dados.id, link: dados.webViewLink ?? `https://drive.google.com/file/d/${dados.id}/view` };
}

export async function baixarTexto(fileId: string): Promise<string> {
  const res = await driveFetch(`/drive/v3/files/${fileId}?alt=media`);
  return res.text();
}
