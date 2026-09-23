import { supabase } from "@/integrations/supabase/client";

export const BUCKET_DOCS = "documentos";

export const TIPOS_DOC_EMPRESA = ["PGR", "PCMSO", "LTCAT", "APR", "Outros"] as const;
export const DOCUMENTOS_GERAIS_COLABORADOR = [
  "Ficha de Registro",
  "Ordem de Serviço (OS)",
  "Documento de Identificação (RG / CNH / CTPS Digital)",
  "Carteira de Trabalho / CLT",
  "Contrato de Trabalho",
  "Ficha de Entrega de EPI",
  "ASO (Atestado de Saúde Ocupacional)",
  "Outros",
] as const;

export const TREINAMENTOS_NR = [
  "Treinamento NR-01 - Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
  "Treinamento NR-03 - Embargo e Interdição",
  "Treinamento NR-04 - Serviços Especializados em Segurança e em Medicina do Trabalho",
  "Treinamento NR-05 - Comissão Interna de Prevenção de Acidentes e Assédio (CIPA)",
  "Treinamento NR-06 - Equipamentos de Proteção Individual (EPI)",
  "Treinamento NR-07 - Programa de Controle Médico de Saúde Ocupacional",
  "Treinamento NR-08 - Edificações",
  "Treinamento NR-09 - Avaliação e Controle das Exposições Ocupacionais",
  "Treinamento NR-10 - Segurança em Instalações e Serviços em Eletricidade",
  "Treinamento NR-11 - Transporte, Movimentação, Armazenagem e Manuseio de Materiais",
  "Treinamento NR-12 - Segurança no Trabalho em Máquinas e Equipamentos",
  "Treinamento NR-13 - Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos",
  "Treinamento NR-14 - Fornos",
  "Treinamento NR-15 - Atividades e Operações Insalubres",
  "Treinamento NR-16 - Atividades e Operações Perigosas",
  "Treinamento NR-17 - Ergonomia",
  "Treinamento NR-18 - Saúde e Segurança no Trabalho na Indústria da Construção",
  "Treinamento NR-19 - Explosivos",
  "Treinamento NR-20 - Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis",
  "Treinamento NR-21 - Trabalhos a Céu Aberto",
  "Treinamento NR-22 - Segurança e Saúde Ocupacional na Mineração",
  "Treinamento NR-23 - Proteção Contra Incêndios",
  "Treinamento NR-24 - Condições Sanitárias e de Conforto nos Locais de Trabalho",
  "Treinamento NR-25 - Resíduos Industriais",
  "Treinamento NR-26 - Sinalização de Segurança",
  "Treinamento NR-28 - Fiscalização e Penalidades",
  "Treinamento NR-29 - Segurança e Saúde no Trabalho Portuário",
  "Treinamento NR-30 - Segurança e Saúde no Trabalho Aquaviário",
  "Treinamento NR-31 - Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura",
  "Treinamento NR-32 - Segurança e Saúde no Trabalho em Serviços de Saúde",
  "Treinamento NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados",
  "Treinamento NR-34 - Condições e Meio Ambiente de Trabalho na Indústria da Construção, Reparação e Desmonte Naval",
  "Treinamento NR-35 - Trabalho em Altura",
  "Treinamento NR-36 - Segurança e Saúde no Trabalho em Empresas de Abate e Processamento de Carnes e Derivados",
  "Treinamento NR-37 - Segurança e Saúde em Plataformas de Petróleo",
  "Treinamento NR-38 - Segurança e Saúde no Trabalho nas Atividades de Limpeza Urbana e Manejo de Resíduos Sólidos",
] as const;

export const TIPOS_DOC_COLABORADOR = [...DOCUMENTOS_GERAIS_COLABORADOR, ...TREINAMENTOS_NR] as const;

export const FUNCOES_CONSTRUCAO = [
  "Servente / Ajudante Geral",
  "Pedreiro",
  "Carpinteiro / Armador",
  "Eletricista",
  "Encanador / Hidráulico",
  "Pintor",
  "Mestre de Obras / Encarregado",
  "Engenheiro Civil",
  "Técnico em Segurança do Trabalho (TST)",
  "Operador de Grua / Máquinas / Equipamentos",
  "Gesseiro / Azulejista",
  "Serralheiro / Soldador",
] as const;

export type Terceirizada = {
  id: string;
  name: string;
  cnpj: string | null;
  contact_email: string | null;
  is_active: boolean;
};

export type Colaborador = {
  id: string;
  contractor_id: string | null;
  name: string;
  cpf: string | null;
  role_title: string | null;
  type: string;
};

export type FuncaoPersonalizada = { id: string; name: string };

export type Documento = {
  id: string;
  doc_type: string;
  title: string;
  file_url: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  status: string;
  version: number;
  created_at: string;
};

export type FiltroPrazo = "todos" | "vencidos" | "7" | "15" | "30";

/** Situação de validade calculada a partir da data de vencimento. */
export type Situacao = {
  nivel: "valido" | "atencao" | "vencido" | "sem-validade";
  rotulo: string;
  dias: number | null;
};

export function situacaoDocumento(validade: string | null): Situacao {
  if (!validade) return { nivel: "sem-validade", rotulo: "Sem validade", dias: null };
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [a, m, d] = validade.split("-").map(Number);
  const fim = new Date(a ?? 0, (m ?? 1) - 1, d ?? 1);
  const dias = Math.round((fim.getTime() - hoje.getTime()) / 86_400_000);
  if (dias < 0)
    return {
      nivel: "vencido",
      rotulo: `CRÍTICO: Vencido há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`,
      dias,
    };
  if (dias <= 30)
    return {
      nivel: "atencao",
      rotulo: dias === 0 ? "Atenção: Vence hoje" : `Atenção: Vence em ${dias} ${dias === 1 ? "dia" : "dias"}`,
      dias,
    };
  return { nivel: "valido", rotulo: "Válido", dias };
}

export function resumoDocumentos(docs: Documento[]) {
  const ativos = docs.filter((d) => d.status === "active");
  let aVencer = 0;
  let vencidos = 0;
  for (const d of ativos) {
    const s = situacaoDocumento(d.expiration_date);
    if (s.nivel === "atencao") aVencer++;
    if (s.nivel === "vencido") vencidos++;
  }
  return { total: ativos.length, aVencer, vencidos };
}

export function documentoNoFiltro(doc: Documento, filtro: FiltroPrazo) {
  if (filtro === "todos") return true;
  const situacao = situacaoDocumento(doc.expiration_date);
  if (filtro === "vencidos") return situacao.dias !== null && situacao.dias < 0;
  const limite = Number(filtro);
  return situacao.dias !== null && situacao.dias >= 0 && situacao.dias <= limite;
}

export function contagemAlertas(docs: Documento[]) {
  const ativos = docs.filter((doc) => doc.status === "active");
  return {
    vencidos: ativos.filter((doc) => documentoNoFiltro(doc, "vencidos")).length,
    sete: ativos.filter((doc) => documentoNoFiltro(doc, "7")).length,
    quinze: ativos.filter((doc) => documentoNoFiltro(doc, "15")).length,
    trinta: ativos.filter((doc) => documentoNoFiltro(doc, "30")).length,
  };
}

/* ------------------------------ Terceirizadas ----------------------------- */

export async function listarTerceirizadas() {
  const { data, error } = await supabase
    .from("contractors")
    .select("id, name, cnpj, contact_email, is_active")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Terceirizada[];
}

export async function salvarTerceirizada(dados: {
  id?: string;
  name: string;
  cnpj: string | null;
  contact_email: string | null;
}) {
  const { id, ...campos } = dados;
  const { error } = id
    ? await supabase.from("contractors").update(campos).eq("id", id)
    : await supabase.from("contractors").insert(campos);
  if (error) throw new Error(error.message);
}

export async function excluirTerceirizada(id: string) {
  const [{ data: docsEmpresa }, { data: colaboradores }] = await Promise.all([
    supabase.from("company_documents").select("file_url").eq("contractor_id", id),
    supabase.from("employees").select("id").eq("contractor_id", id),
  ]);
  const ids = (colaboradores ?? []).map((c) => c.id);
  const { data: docsColaboradores } = ids.length
    ? await supabase.from("employee_documents").select("file_url").in("employee_id", ids)
    : { data: [] };
  const { error } = await supabase.from("contractors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  const caminhos = [...(docsEmpresa ?? []), ...(docsColaboradores ?? [])]
    .map((d) => d.file_url)
    .filter((c): c is string => Boolean(c));
  if (caminhos.length) await supabase.storage.from(BUCKET_DOCS).remove(caminhos);
}

/* ------------------------------ Colaboradores ----------------------------- */

export async function listarColaboradores(contractorId: string | null) {
  let consulta = supabase
    .from("employees")
    .select("id, contractor_id, name, cpf, role_title, type")
    .order("name");
  consulta = contractorId ? consulta.eq("contractor_id", contractorId) : consulta.is("contractor_id", null);
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return (data ?? []) as Colaborador[];
}

/** Procura outro colaborador da mesma empresa com o mesmo CPF. */
export async function colaboradorComMesmoCpf(
  contractorId: string | null,
  cpf: string,
  ignorarId?: string,
) {
  const formatado = formatarCpf(cpf);
  let consulta = supabase.from("employees").select("id, name").eq("cpf", formatado);
  consulta = contractorId
    ? consulta.eq("contractor_id", contractorId)
    : consulta.is("contractor_id", null);
  if (ignorarId) consulta = consulta.neq("id", ignorarId);
  const { data, error } = await consulta.limit(1);
  if (error) throw new Error(error.message);
  return (data ?? [])[0] ?? null;
}

export async function salvarColaborador(dados: {
  id?: string;
  contractor_id: string | null;
  name: string;
  cpf: string | null;
  role_title: string | null;
}) {
  const { id, ...campos } = dados;
  if (campos.cpf) {
    const duplicado = await colaboradorComMesmoCpf(campos.contractor_id, campos.cpf, id);
    if (duplicado)
      throw new Error(
        `Já existe um colaborador cadastrado nesta empresa com o CPF ${formatarCpf(campos.cpf)}: ${duplicado.name}.`,
      );
    campos.cpf = formatarCpf(campos.cpf);
  }
  const payload = { ...campos, type: campos.contractor_id ? "contractor" : "direct" };
  const { error } = id
    ? await supabase.from("employees").update(payload).eq("id", id)
    : await supabase.from("employees").insert(payload);
  if (error) throw new Error(error.message);
}

export type LinhaCsv = { name: string; cpf: string; role_title: string };

/** Lê um CSV simples com colunas Nome, CPF e Função (com ou sem cabeçalho). */
export function lerCsvColaboradores(texto: string): LinhaCsv[] {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linhas.length === 0) return [];
  const separador = (linhas[0]?.match(/;/g)?.length ?? 0) > (linhas[0]?.match(/,/g)?.length ?? 0) ? ";" : ",";
  const partir = (linha: string) =>
    linha
      .split(separador)
      .map((c) => c.trim().replace(/^"(.*)"$/, "$1").trim());
  const primeira = partir(linhas[0] ?? "").join(" ").toLowerCase();
  const corpo = /nome/.test(primeira) && /cpf|fun/.test(primeira) ? linhas.slice(1) : linhas;
  return corpo.map((linha) => {
    const [name = "", cpf = "", role_title = ""] = partir(linha);
    return { name, cpf, role_title };
  });
}

export type ResultadoImportacao = {
  importados: number;
  erros: { linha: number; nome: string; motivo: string }[];
};

/** Importa colaboradores do CSV, validando CPF e reaproveitando as funções salvas. */
export async function importarColaboradores(
  contractorId: string | null,
  linhas: LinhaCsv[],
): Promise<ResultadoImportacao> {
  const resultado: ResultadoImportacao = { importados: 0, erros: [] };
  const funcoesSalvas = await listarFuncoesPersonalizadas(contractorId);
  const conhecidas = new Set(
    [...FUNCOES_CONSTRUCAO, ...funcoesSalvas.map((f) => f.name)].map((n) => n.toLowerCase()),
  );
  const cpfsDoArquivo = new Set<string>();

  for (const [indice, linha] of linhas.entries()) {
    const numero = indice + 1;
    const nome = linha.name.trim().slice(0, 120);
    const funcao = linha.role_title.trim().slice(0, 80);
    const cpf = linha.cpf.trim();
    try {
      if (!nome) throw new Error("Nome não informado.");
      if (!cpf) throw new Error("CPF não informado.");
      if (!cpfValido(cpf)) throw new Error("CPF inválido.");
      const formatado = formatarCpf(cpf);
      if (cpfsDoArquivo.has(formatado)) throw new Error("CPF repetido na própria planilha.");
      cpfsDoArquivo.add(formatado);
      if (funcao && !conhecidas.has(funcao.toLowerCase())) {
        await adicionarFuncaoPersonalizada(contractorId, funcao).catch(() => undefined);
        conhecidas.add(funcao.toLowerCase());
      }
      await salvarColaborador({
        contractor_id: contractorId,
        name: nome,
        cpf: formatado,
        role_title: funcao || null,
      });
      resultado.importados++;
    } catch (e) {
      resultado.erros.push({ linha: numero, nome: nome || "(sem nome)", motivo: (e as Error).message });
    }
  }
  return resultado;
}

export async function excluirColaborador(id: string) {
  const { data: docs } = await supabase.from("employee_documents").select("file_url").eq("employee_id", id);
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw new Error(error.message);
  const caminhos = (docs ?? []).map((d) => d.file_url).filter((c): c is string => Boolean(c));
  if (caminhos.length) await supabase.storage.from(BUCKET_DOCS).remove(caminhos);
}

export async function listarFuncoesPersonalizadas(contractorId: string | null) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sessão expirada. Entre novamente.");
  let consulta = supabase
    .from("company_job_roles")
    .select("id, name")
    .eq("user_id", userId)
    .order("name");
  consulta = contractorId
    ? consulta.eq("contractor_id", contractorId)
    : consulta.is("contractor_id", null);
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return (data ?? []) as FuncaoPersonalizada[];
}

export async function adicionarFuncaoPersonalizada(contractorId: string | null, name: string) {
  const nome = name.trim().replace(/\s+/g, " ").slice(0, 80);
  if (nome.length < 2) throw new Error("Informe uma função com pelo menos 2 caracteres.");
  const { error } = await supabase.from("company_job_roles").insert({
    contractor_id: contractorId,
    name: nome,
  });
  if (error?.code === "23505") throw new Error("Esta função já está salva na lista.");
  if (error) throw new Error(error.message);
  return nome;
}

export function formatarCpf(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function cpfValido(valor: string) {
  const cpf = valor.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calcular = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(9) === Number(cpf[9]) && calcular(10) === Number(cpf[10]);
}

/* -------------------------------- Documentos ------------------------------ */

export async function listarDocumentosEmpresa(contractorId: string | null) {
  let consulta = supabase
    .from("company_documents")
    .select("id, doc_type, title, file_url, issue_date, expiration_date, status, version, created_at")
    .order("version", { ascending: false });
  consulta = contractorId ? consulta.eq("contractor_id", contractorId) : consulta.is("contractor_id", null);
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return (data ?? []) as Documento[];
}

export async function listarDocumentosColaborador(employeeId: string) {
  const { data, error } = await supabase
    .from("employee_documents")
    .select("id, doc_type, title, file_url, issue_date, expiration_date, status, version, created_at")
    .eq("employee_id", employeeId)
    .order("version", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Documento[];
}

async function enviarArquivo(arquivo: File, userId: string) {
  const ext = arquivo.name.split(".").pop() ?? "pdf";
  const caminho = `${userId}/ged/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_DOCS)
    .upload(caminho, arquivo, { contentType: arquivo.type || "application/pdf" });
  if (error) throw new Error(error.message);
  return caminho;
}

export async function urlDocumento(caminho: string) {
  const { data, error } = await supabase.storage.from(BUCKET_DOCS).createSignedUrl(caminho, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** Remove acentos e caracteres inválidos em nomes de arquivo. */
export function sanitizarNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/** Monta "Título - Entidade.ext" a partir do título do documento e do dono do arquivo. */
export function nomeArquivoDocumento(titulo: string, entidade: string | null | undefined, caminho: string | null) {
  const ext = (caminho?.split(".").pop() ?? "pdf").toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  const base = sanitizarNomeArquivo(entidade ? `${titulo} - ${entidade}` : titulo) || "documento";
  return `${base}.${ext}`;
}

/** URL assinada que força o download com o nome personalizado (Content-Disposition). */
export async function urlDownloadDocumento(caminho: string, nomeArquivo: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_DOCS)
    .createSignedUrl(caminho, 3600, { download: nomeArquivo });
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** Baixa o arquivo no navegador com o nome personalizado. */
export async function baixarDocumentoComNome(
  caminho: string | null,
  titulo: string,
  entidade?: string | null,
) {
  if (!caminho) throw new Error("Este registro não possui arquivo anexado.");
  const nome = nomeArquivoDocumento(titulo, entidade, caminho);
  const url = await urlDownloadDocumento(caminho, nome);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}


type NovoDocumento = {
  doc_type: string;
  title: string;
  issue_date: string | null;
  expiration_date: string | null;
  arquivo: File | null;
};

/**
 * Anexa um documento. Se já existir documento ativo com o mesmo tipo e título,
 * o anterior vira "obsolete" e o novo entra com a versão seguinte.
 */
export async function anexarDocumento(
  escopo: { tipo: "empresa"; contractorId: string | null } | { tipo: "colaborador"; employeeId: string },
  dados: NovoDocumento,
) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sessão expirada. Entre novamente.");

  const tabela = escopo.tipo === "empresa" ? "company_documents" : "employee_documents";

  const buscar = async () => {
    if (escopo.tipo === "empresa") {
      const base = supabase
        .from("company_documents")
        .select("id, version")
        .eq("doc_type", dados.doc_type)
        .eq("title", dados.title);
      return escopo.contractorId
        ? await base.eq("contractor_id", escopo.contractorId)
        : await base.is("contractor_id", null);
    }
    return await supabase
      .from("employee_documents")
      .select("id, version")
      .eq("doc_type", dados.doc_type)
      .eq("title", dados.title)
      .eq("employee_id", escopo.employeeId);
  };

  const { data: existentes, error: erroBusca } = await buscar();
  if (erroBusca) throw new Error(erroBusca.message);

  const versao = Math.max(0, ...(existentes ?? []).map((d) => d.version as number)) + 1;
  const file_url = dados.arquivo ? await enviarArquivo(dados.arquivo, userId) : null;

  const { error } = await supabase.from(tabela).insert({
    doc_type: dados.doc_type,
    title: dados.title,
    issue_date: dados.issue_date,
    expiration_date: dados.expiration_date,
    file_url,
    version: versao,
    status: "active",
    ...(escopo.tipo === "empresa"
      ? { contractor_id: escopo.contractorId }
      : { employee_id: escopo.employeeId }),
  } as never);
  if (error) throw new Error(error.message);

  // Só depois de gravar a nova versão marcamos as anteriores como obsoletas.
  const idsAntigos = (existentes ?? []).map((d) => d.id as string);
  if (idsAntigos.length > 0) {
    const { error: erroObsoleto } = await supabase
      .from(tabela)
      .update({ status: "obsolete" })
      .in("id", idsAntigos);
    if (erroObsoleto) throw new Error(erroObsoleto.message);
  }
}

export async function excluirDocumento(
  tabela: "company_documents" | "employee_documents",
  id: string,
  caminho: string | null,
) {
  const { error } = await supabase.from(tabela).delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (caminho) {
    const { error: erroArquivo } = await supabase.storage.from(BUCKET_DOCS).remove([caminho]);
    if (erroArquivo) throw new Error(`O cadastro foi excluído, mas o arquivo não pôde ser removido: ${erroArquivo.message}`);
  }
}

export async function atualizarDocumento(
  tabela: "company_documents" | "employee_documents",
  id: string,
  dados: { doc_type: string; title: string; issue_date: string | null; expiration_date: string | null },
) {
  const { error } = await supabase.from(tabela).update(dados).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------- Painel geral de alertas ------------------------ */

export type DocumentoAlerta = Documento & {
  tabela: "company_documents" | "employee_documents";
  empresa: string;
  origem: string;
};

/** Lista todos os documentos ativos do sistema com empresa e origem para o painel de alertas. */
export async function listarDocumentosConsolidados(): Promise<DocumentoAlerta[]> {
  const campos = "id, doc_type, title, file_url, issue_date, expiration_date, status, version, created_at";
  const [empresa, colaborador] = await Promise.all([
    supabase.from("company_documents").select(`${campos}, contractor_id, contractors(name)`),
    supabase
      .from("employee_documents")
      .select(`${campos}, employees(name, contractor_id, contractors(name))`),
  ]);
  if (empresa.error) throw new Error(empresa.error.message);
  if (colaborador.error) throw new Error(colaborador.error.message);

  const nomeEmpresa = (contratada: { name?: string } | null | undefined) =>
    contratada?.name ? `Terceirizada: ${contratada.name}` : "Empresa Própria";

  const docsEmpresa: DocumentoAlerta[] = (empresa.data ?? []).map((d) => {
    const { contractor_id: _c, contractors, ...resto } = d as never as Record<string, unknown> & {
      contractors: { name: string } | null;
    };
    return {
      ...(resto as unknown as Documento),
      tabela: "company_documents" as const,
      empresa: nomeEmpresa(contractors),
      origem: "Documento da Empresa",
    };
  });

  const docsColaborador: DocumentoAlerta[] = (colaborador.data ?? []).map((d) => {
    const { employees, ...resto } = d as never as Record<string, unknown> & {
      employees: { name: string; contractors: { name: string } | null } | null;
    };
    return {
      ...(resto as unknown as Documento),
      tabela: "employee_documents" as const,
      empresa: nomeEmpresa(employees?.contractors),
      origem: `Documento do Colaborador: ${employees?.name ?? "—"}`,
    };
  });

  return [...docsEmpresa, ...docsColaborador].filter((d) => d.status === "active");
}

/** Agrupa os documentos por empresa e ordena do vencimento mais urgente para o menos urgente. */
export function agruparPorEmpresa(docs: DocumentoAlerta[]) {
  const mapa = new Map<string, DocumentoAlerta[]>();
  for (const doc of docs) {
    const atual = mapa.get(doc.empresa) ?? [];
    atual.push(doc);
    mapa.set(doc.empresa, atual);
  }
  return [...mapa.entries()]
    .map(([empresa, lista]) => ({
      empresa,
      documentos: lista.sort((a, b) => {
        const da = situacaoDocumento(a.expiration_date).dias;
        const db = situacaoDocumento(b.expiration_date).dias;
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      }),
    }))
    .sort((a, b) => a.empresa.localeCompare(b.empresa, "pt-BR"));
}
