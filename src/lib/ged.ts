import { supabase } from "@/integrations/supabase/client";
import {
  cpfValido,
  digitosCpf,
  encontrarColaboradorPorCpf,
  formatarCpf,
  mensagemCpfDuplicado,
  normalizarBusca,
} from "@/lib/ged-regras";

export {
  agruparAlertas,
  analisarPlanilhaColaboradores,
  contagemAlertas,
  cpfValido,
  digitosCpf,
  documentoNoFiltro,
  encontrarColaboradorPorCpf,
  formatarCpf,
  mensagemCpfDuplicado,
  MODELO_CSV_COLABORADORES,
  normalizarBusca,
  resumoDocumentos,
  resolverFuncao,
  rotuloContagemValidade,
  situacaoDocumento,
  type FiltroPrazo,
  type ItemAgrupavel,
  type LinhaPlanilhaColaborador,
  type Situacao,
  type TomValidade,
} from "@/lib/ged-regras";

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

export const TIPOS_DOC_COLABORADOR = [
  ...DOCUMENTOS_GERAIS_COLABORADOR,
  ...TREINAMENTOS_NR,
] as const;

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
  user_id: string;
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
    .select("id, contractor_id, name, cpf, role_title, type, user_id")
    .order("name");
  consulta = contractorId
    ? consulta.eq("contractor_id", contractorId)
    : consulta.is("contractor_id", null);
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return (data ?? []) as Colaborador[];
}

export async function buscarColaboradorDuplicado(
  contractorId: string | null,
  cpf: string,
  ignorarId?: string,
) {
  if (!digitosCpf(cpf)) return null;
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sessão expirada. Entre novamente.");
  let consulta = supabase.from("employees").select("id, name, cpf").eq("user_id", userId);
  consulta = contractorId
    ? consulta.eq("contractor_id", contractorId)
    : consulta.is("contractor_id", null);
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return encontrarColaboradorPorCpf(data ?? [], cpf, ignorarId);
}

export async function salvarColaborador(dados: {
  id?: string;
  contractor_id: string | null;
  name: string;
  cpf: string | null;
  role_title: string | null;
}) {
  const { id, ...campos } = dados;
  if (!campos.name.trim()) throw new Error("Informe o nome do colaborador.");
  const cpf = campos.cpf && digitosCpf(campos.cpf) ? formatarCpf(campos.cpf) : null;
  if (cpf && !cpfValido(cpf)) throw new Error("Informe um CPF válido.");
  if (cpf) {
    const duplicado = await buscarColaboradorDuplicado(campos.contractor_id, cpf, id);
    if (duplicado) throw new Error(mensagemCpfDuplicado(duplicado.name));
  }
  const payload = {
    contractor_id: campos.contractor_id,
    name: campos.name.trim().slice(0, 120),
    cpf,
    role_title: campos.role_title?.trim() ? campos.role_title.trim().slice(0, 80) : null,
    type: campos.contractor_id ? "contractor" : "direct",
  };
  const { error } = id
    ? await supabase.from("employees").update(payload).eq("id", id)
    : await supabase.from("employees").insert(payload);
  if (error?.code === "23505") {
    throw new Error(
      "Já existe um cadastro com este CPF nesta empresa. Use o cadastro existente ou informe outro CPF.",
    );
  }
  if (error) throw new Error(error.message);
}

export async function importarColaboradoresValidos(
  contractorId: string | null,
  linhas: readonly {
    name: string;
    cpf: string | null;
    role_title: string;
    funcaoNova: boolean;
  }[],
) {
  const funcoesNovas = new Map<string, string>();
  let salvos = 0;
  for (const linha of linhas) {
    let role = linha.role_title;
    if (linha.funcaoNova) {
      const chave = normalizarBusca(role);
      const jaSalva = funcoesNovas.get(chave);
      if (jaSalva) role = jaSalva;
      else {
        try {
          role = await adicionarFuncaoPersonalizada(contractorId, role);
        } catch (erro) {
          const mensagem =
            erro instanceof Error ? erro.message : "Não foi possível salvar a função.";
          if (!mensagem.includes("já está salva")) throw new Error(`${linha.name}: ${mensagem}`);
        }
        funcoesNovas.set(chave, role);
      }
    }
    try {
      await salvarColaborador({
        contractor_id: contractorId,
        name: linha.name,
        cpf: linha.cpf,
        role_title: role,
      });
    } catch (erro) {
      const mensagem =
        erro instanceof Error ? erro.message : "Não foi possível salvar o colaborador.";
      throw new Error(
        salvos > 0 ? `${mensagem} ${salvos} colaborador(es) já tinham sido importados.` : mensagem,
      );
    }
    salvos += 1;
  }
  return salvos;
}

export async function excluirColaborador(id: string) {
  const { data: docs } = await supabase
    .from("employee_documents")
    .select("file_url")
    .eq("employee_id", id);
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

export type DocumentoAlerta = {
  documento: Documento;
  tabela: "company_documents" | "employee_documents";
  origem: "empresa" | "colaborador";
  colaboradorNome: string | null;
  empresaChave: string;
  empresaRotulo: string;
  empresaTipo: "propria" | "terceirizada";
};

function identidadeEmpresa(
  contractorId: string | null,
  nomeEmpresaPropria: string,
  empresas: ReadonlyMap<string, string>,
) {
  if (!contractorId) {
    return {
      empresaChave: "propria",
      empresaRotulo: `Empresa Própria: ${nomeEmpresaPropria}`,
      empresaTipo: "propria" as const,
    };
  }
  return {
    empresaChave: `ter:${contractorId}`,
    empresaRotulo: `Terceirizada: ${empresas.get(contractorId) ?? "Sem identificação"}`,
    empresaTipo: "terceirizada" as const,
  };
}

function comoDocumento(row: {
  id: string;
  doc_type: string;
  title: string;
  file_url: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  status: string;
  version: number;
  created_at: string;
}): Documento {
  return {
    id: row.id,
    doc_type: row.doc_type,
    title: row.title,
    file_url: row.file_url,
    issue_date: row.issue_date,
    expiration_date: row.expiration_date,
    status: row.status,
    version: row.version,
    created_at: row.created_at,
  };
}

/** Documentos ativos de todas as empresas próprias e terceirizadas, com a origem de cada um. */
export async function listarDocumentosParaAlertas(nomeEmpresaPropria: string) {
  const nomePropria = nomeEmpresaPropria.trim() || "Matriz";
  const [empresaRes, colaboradorRes, pessoasRes, empresasRes] = await Promise.all([
    supabase
      .from("company_documents")
      .select(
        "id, doc_type, title, file_url, issue_date, expiration_date, status, version, created_at, contractor_id",
      )
      .eq("status", "active"),
    supabase
      .from("employee_documents")
      .select(
        "id, doc_type, title, file_url, issue_date, expiration_date, status, version, created_at, employee_id",
      )
      .eq("status", "active"),
    supabase.from("employees").select("id, name, contractor_id"),
    supabase.from("contractors").select("id, name"),
  ]);
  for (const resposta of [empresaRes, colaboradorRes, pessoasRes, empresasRes]) {
    if (resposta.error) throw new Error(resposta.error.message);
  }

  const empresas = new Map((empresasRes.data ?? []).map((empresa) => [empresa.id, empresa.name]));
  const pessoas = new Map((pessoasRes.data ?? []).map((pessoa) => [pessoa.id, pessoa]));
  const itens: DocumentoAlerta[] = [];

  for (const row of empresaRes.data ?? []) {
    const { contractor_id: contractorId, ...campos } = row;
    itens.push({
      documento: comoDocumento(campos),
      tabela: "company_documents",
      origem: "empresa",
      colaboradorNome: null,
      ...identidadeEmpresa(contractorId, nomePropria, empresas),
    });
  }

  for (const row of colaboradorRes.data ?? []) {
    const { employee_id: employeeId, ...campos } = row;
    const pessoa = pessoas.get(employeeId);
    itens.push({
      documento: comoDocumento(campos),
      tabela: "employee_documents",
      origem: "colaborador",
      colaboradorNome: pessoa?.name ?? "Colaborador removido",
      ...identidadeEmpresa(pessoa?.contractor_id ?? null, nomePropria, empresas),
    });
  }

  return itens;
}

/* -------------------------------- Documentos ------------------------------ */

export async function listarDocumentosEmpresa(contractorId: string | null) {
  let consulta = supabase
    .from("company_documents")
    .select(
      "id, doc_type, title, file_url, issue_date, expiration_date, status, version, created_at",
    )
    .order("version", { ascending: false });
  consulta = contractorId
    ? consulta.eq("contractor_id", contractorId)
    : consulta.is("contractor_id", null);
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return (data ?? []) as Documento[];
}

export async function listarDocumentosColaborador(employeeId: string) {
  const { data, error } = await supabase
    .from("employee_documents")
    .select(
      "id, doc_type, title, file_url, issue_date, expiration_date, status, version, created_at",
    )
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
  escopo:
    { tipo: "empresa"; contractorId: string | null } | { tipo: "colaborador"; employeeId: string },
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
    if (erroArquivo)
      throw new Error(
        `O cadastro foi excluído, mas o arquivo não pôde ser removido: ${erroArquivo.message}`,
      );
  }
}

export async function atualizarDocumento(
  tabela: "company_documents" | "employee_documents",
  id: string,
  dados: {
    doc_type: string;
    title: string;
    issue_date: string | null;
    expiration_date: string | null;
  },
) {
  const { error } = await supabase.from(tabela).update(dados).eq("id", id);
  if (error) throw new Error(error.message);
}
