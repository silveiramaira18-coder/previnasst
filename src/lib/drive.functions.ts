import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function limpar(valor: unknown, max = 200) {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

function nomePasta(empresa: string) {
  const limpo = empresa.replace(/[\\/]+/g, "-").trim();
  return limpo || "Sem empresa";
}

/** Envia o PDF do relatório para a pasta da empresa no Google Drive. */
export const enviarRelatorioParaDrive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { nomeArquivo: string; empresa: string; pdfBase64: string }) => {
    const nomeArquivo = limpar(input?.nomeArquivo, 180);
    const empresa = limpar(input?.empresa, 120);
    const pdfBase64 = typeof input?.pdfBase64 === "string" ? input.pdfBase64 : "";
    if (!nomeArquivo || !pdfBase64) throw new Error("Dados do relatório inválidos.");
    if (pdfBase64.length > 30_000_000) throw new Error("Relatório muito grande para envio.");
    return { nomeArquivo, empresa, pdfBase64 };
  })
  .handler(async ({ data }) => {
    const { garantirPasta, enviarArquivo, buscarArquivo, PASTA_RELATORIOS } = await import("./drive.server");
    const pastaEmpresa = await garantirPasta(nomePasta(data.empresa), PASTA_RELATORIOS);
    const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
    const existente = await buscarArquivo(data.nomeArquivo, pastaEmpresa);
    const arquivo = await enviarArquivo({
      nome: data.nomeArquivo,
      pastaId: pastaEmpresa,
      conteudo: bytes,
      contentType: "application/pdf",
      substituirId: existente,
    });
    return { ok: true as const, link: arquivo.link };
  });

/** Acrescenta o novo usuário na planilha (CSV) de usuários cadastrados. */
export const registrarUsuarioNaPlanilha = createServerFn({ method: "POST" })
  .inputValidator((input: { nome: string; email: string; empresa?: string; perfil?: string }) => {
    const email = limpar(input?.email, 160).toLowerCase();
    if (!email || !email.includes("@")) throw new Error("E-mail inválido.");
    return {
      nome: limpar(input?.nome, 120),
      email,
      empresa: limpar(input?.empresa, 120),
      perfil: limpar(input?.perfil, 40),
    };
  })
  .handler(async ({ data }) => {
    const { buscarArquivo, baixarTexto, enviarArquivo, PASTA_USUARIOS, ARQUIVO_USUARIOS } = await import(
      "./drive.server"
    );
    const cabecalho = "Data de cadastro,Nome,E-mail,Empresa,Perfil";
    const existente = await buscarArquivo(ARQUIVO_USUARIOS, PASTA_USUARIOS);
    let atual = existente ? await baixarTexto(existente) : "";
    if (!atual.trim()) atual = cabecalho;

    const campo = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const linha = [
      new Date().toISOString(),
      data.nome,
      data.email,
      data.empresa,
      data.perfil || "inspetor",
    ]
      .map(campo)
      .join(",");

    const conteudo = `${atual.replace(/\s*$/, "")}\n${linha}\n`;
    await enviarArquivo({
      nome: ARQUIVO_USUARIOS,
      pastaId: PASTA_USUARIOS,
      conteudo: new TextEncoder().encode(conteudo),
      contentType: "text/csv",
      substituirId: existente,
    });
    return { ok: true as const };
  });
