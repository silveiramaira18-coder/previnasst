import { supabase } from "@/integrations/supabase/client";

export const BUCKET_DOCS = "documentos";

export const TIPOS_DOC_EMPRESA = ["PGR", "PCMSO", "LTCAT", "APR", "Outros"] as const;
export const TIPOS_DOC_COLABORADOR = ["ASO", "Treinamento NR", "Ficha EPI", "Outros"] as const;

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
  const { error } = await supabase.from("contractors").delete().eq("id", id);
  if (error) throw new Error(error.message);
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

export async function salvarColaborador(dados: {
  id?: string;
  contractor_id: string | null;
  name: string;
  cpf: string | null;
  role_title: string | null;
}) {
  const { id, ...campos } = dados;
  const payload = { ...campos, type: campos.contractor_id ? "contractor" : "direct" };
  const { error } = id
    ? await supabase.from("employees").update(payload).eq("id", id)
    : await supabase.from("employees").insert(payload);
  if (error) throw new Error(error.message);
}

export async function excluirColaborador(id: string) {
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw new Error(error.message);
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

  let anteriores = supabase
    .from(tabela)
    .select("id, version")
    .eq("doc_type", dados.doc_type)
    .eq("title", dados.title);
  anteriores =
    escopo.tipo === "empresa"
      ? escopo.contractorId
        ? anteriores.eq("contractor_id", escopo.contractorId)
        : anteriores.is("contractor_id", null)
      : anteriores.eq("employee_id", escopo.employeeId);

  const { data: existentes, error: erroBusca } = await anteriores;
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
  if (caminho) await supabase.storage.from(BUCKET_DOCS).remove([caminho]);
  const { error } = await supabase.from(tabela).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
