import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Papel = "admin" | "inspetor" | "responsavel";

/** Únicos e-mails com privilégios de administrador (também validados no banco). */
export const EMAILS_ADMIN = ["silveiramaira18@gmail.com", "previnasst2@gmail.com"] as const;

/** Compatibilidade: e-mail da administradora principal. */
export const EMAIL_ADMIN_PRINCIPAL = EMAILS_ADMIN[0];

export function ehEmailAdmin(email?: string | null) {
  return EMAILS_ADMIN.includes((email ?? "").trim().toLowerCase() as (typeof EMAILS_ADMIN)[number]);
}

export const rotuloPapel: Record<Papel, string> = {
  admin: "Administradora principal",
  inspetor: "Inspetor",
  responsavel: "Responsável pela obra",
};

export const CARGOS = [
  "Técnica em Segurança do Trabalho",
  "Técnico de Segurança do Trabalho",
  "Engenheiro de Segurança do Trabalho",
  "Engenheiro Civil",
  "Supervisor de Segurança",
  "Coordenador de Segurança",
  "Gestor",
  "Outro",
];

/** Permissões por tipo de usuário. */
export const permissoes = {
  admin: {
    criarInspecao: true,
    editarInspecao: true,
    registrarNC: true,
    gerenciarObras: true,
    gerenciarChecklists: true,
    atualizarAcoes: true,
    adicionarFotos: true,
    verRelatorios: true,
    administrar: true,
  },
  inspetor: {
    criarInspecao: true,
    editarInspecao: true,
    registrarNC: true,
    gerenciarObras: true,
    gerenciarChecklists: false,
    atualizarAcoes: true,
    adicionarFotos: true,
    verRelatorios: true,
    administrar: false,
  },
  responsavel: {
    criarInspecao: false,
    editarInspecao: false,
    registrarNC: false,
    gerenciarObras: false,
    gerenciarChecklists: false,
    atualizarAcoes: true,
    adicionarFotos: true,
    verRelatorios: true,
    administrar: false,
  },
} satisfies Record<Papel, Record<string, boolean>>;

export type Permissao = keyof (typeof permissoes)["admin"];

export type Perfil = {
  id: string;
  nome: string | null;
  empresa: string | null;
  cargo: string | null;
  telefone: string | null;
  avatar_url: string | null;
  email: string | null;
  papel: Papel;
  adminPrincipal: boolean;
};

export async function carregarPerfil(): Promise<Perfil | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const [{ data: perfil }, { data: papeis }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome, empresa, cargo, telefone, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const adminPrincipal = (user.email ?? "").toLowerCase() === EMAIL_ADMIN_PRINCIPAL;
  const lista = (papeis ?? []).map((p) => p.role as Papel);
  const papel: Papel = adminPrincipal
    ? "admin"
    : lista.includes("responsavel")
      ? "responsavel"
      : "inspetor";

  return {
    id: user.id,
    nome: perfil?.nome ?? (user.user_metadata?.['nome'] as string | undefined) ?? null,
    empresa: perfil?.empresa ?? null,
    cargo: perfil?.cargo ?? null,
    telefone: perfil?.telefone ?? null,
    avatar_url: perfil?.avatar_url ?? null,
    email: user.email ?? null,
    papel,
    adminPrincipal,
  };
}

export function usePerfil() {
  const query = useQuery({ queryKey: ["perfil"], queryFn: carregarPerfil, staleTime: 60_000 });
  const papel = query.data?.papel ?? null;
  return {
    ...query,
    perfil: query.data ?? null,
    papel,
    adminPrincipal: query.data?.adminPrincipal ?? false,
    pode: (p: Permissao) => (papel ? permissoes[papel][p] : false),
  };
}

export async function salvarPerfil(dados: {
  nome: string;
  empresa: string;
  cargo?: string | null;
  telefone: string;
  avatar_url?: string | null;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const id = auth.user?.id;
  if (!id) throw new Error("Sessão expirada. Entre novamente.");
  const { error } = await supabase.from("profiles").upsert({ id, ...dados });
  if (error) throw new Error(error.message);
}

export async function alterarSenha(novaSenha: string) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw new Error(error.message);
}
