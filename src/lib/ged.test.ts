import { beforeEach, describe, expect, it, mock } from "bun:test";

type Row = Record<string, unknown>;

const state: {
  userId: string | null;
  tables: Record<string, Row[]>;
  insertError: string | null;
  inserts: { table: string; payload: Row }[];
} = { userId: "user-1", tables: {}, insertError: null, inserts: [] };

function builder(table: string) {
  const filtros: [string, string, unknown][] = [];
  const resolver = () => {
    let linhas = [...(state.tables[table] ?? [])];
    for (const [op, col, val] of filtros) {
      if (op === "eq") linhas = linhas.filter((r) => r[col] === val);
      else if (op === "is")
        linhas = linhas.filter((r) => (val === null ? r[col] == null : r[col] === val));
      else if (op === "not")
        linhas = linhas.filter((r) => (val === null ? r[col] != null : r[col] !== val));
    }
    return { data: linhas, error: null };
  };
  const b = {
    select: () => b,
    order: () => b,
    eq: (col: string, val: unknown) => {
      filtros.push(["eq", col, val]);
      return b;
    },
    is: (col: string, val: unknown) => {
      filtros.push(["is", col, val]);
      return b;
    },
    not: (col: string, _op: string, val: unknown) => {
      filtros.push(["not", col, val]);
      return b;
    },
    insert: async (payload: Row) => {
      state.inserts.push({ table, payload });
      if (state.insertError) return { error: { message: state.insertError } };
      (state.tables[table] ??= []).push({ id: `gen-${state.inserts.length}`, ...payload });
      return { error: null };
    },
    update: () => ({ eq: async () => ({ error: null }) }),
    then: (onF: (v: ReturnType<typeof resolver>) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(resolver()).then(onF, onR),
  };
  return b;
}

const fakeSupabase = {
  auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null } }) },
  from: (t: string) => builder(t),
};

mock.module("@/integrations/supabase/client", () => ({ supabase: fakeSupabase }));

const {
  salvarColaborador,
  colaboradorComMesmoCpf,
  carregarAlertasConsolidados,
  agruparAlertas,
  cpfNormalizado,
  rotuloEmpresa,
  nomeEmpresaPrincipal,
} = await import("@/lib/ged");
type DocumentoAlerta = Awaited<ReturnType<typeof carregarAlertasConsolidados>>[number];

beforeEach(() => {
  state.userId = "user-1";
  state.tables = {};
  state.insertError = null;
  state.inserts = [];
});

describe("CPF: normalização e duplicidade por empresa", () => {
  const maria = {
    id: "e1",
    user_id: "user-1",
    contractor_id: null,
    name: "Maria Oliveira",
    cpf: "111.444.777-35",
    role_title: "Engenheiro Civil",
    type: "direct",
  };

  it("cpfNormalizado mantém apenas dígitos", () => {
    expect(cpfNormalizado("111.444.777-35")).toBe("11144477735");
    expect(cpfNormalizado(null)).toBe("");
  });

  it("encontra colaborador com o mesmo CPF na mesma empresa (ignora pontuação)", async () => {
    state.tables.employees = [maria];
    const achado = await colaboradorComMesmoCpf(null, "11144477735");
    expect(achado?.name).toBe("Maria Oliveira");
  });

  it("não considera duplicado em empresa (contractor) diferente", async () => {
    state.tables.employees = [maria];
    expect(await colaboradorComMesmoCpf("contractor-9", "111.444.777-35")).toBeNull();
  });

  it("ignora o próprio registro ao editar", async () => {
    state.tables.employees = [maria];
    expect(await colaboradorComMesmoCpf(null, "111.444.777-35", "e1")).toBeNull();
  });

  it("salvarColaborador bloqueia CPF duplicado com mensagem clara", async () => {
    state.tables.employees = [maria];
    await expect(
      salvarColaborador({
        contractor_id: null,
        name: "Maria Clone",
        cpf: "111.444.777-35",
        role_title: "Pedreiro",
      }),
    ).rejects.toThrow(/Maria Oliveira.*Engenheiro Civil/);
    expect(state.inserts).toHaveLength(0);
  });

  it("salvarColaborador rejeita CPF inválido antes de inserir", async () => {
    await expect(
      salvarColaborador({
        contractor_id: null,
        name: "X",
        cpf: "111.111.111-11",
        role_title: "Pedreiro",
      }),
    ).rejects.toThrow(/CPF válido/);
    expect(state.inserts).toHaveLength(0);
  });

  it("salvarColaborador insere quando o CPF é único no escopo", async () => {
    state.tables.employees = [maria];
    await salvarColaborador({
      contractor_id: null,
      name: "Ana Souza",
      cpf: "529.982.247-25",
      role_title: "Pedreiro",
    });
    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0]!.payload).toMatchObject({ name: "Ana Souza", type: "direct" });
  });

  it("permite o mesmo CPF em empresas diferentes", async () => {
    state.tables.employees = [maria];
    await salvarColaborador({
      contractor_id: "contractor-9",
      name: "Maria em terceirizada",
      cpf: "111.444.777-35",
      role_title: "Pedreiro",
    });
    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0]!.payload).toMatchObject({ type: "contractor" });
  });
});

describe("carregarAlertasConsolidados", () => {
  it("mapeia origem, empresa e nome do colaborador e ignora obsoletos", async () => {
    state.tables.contractors = [{ id: "c1", name: "MEC Empreendimentos" }];
    state.tables.company_documents = [
      {
        id: "cd1",
        doc_type: "PGR",
        title: "PGR 2026",
        status: "active",
        expiration_date: "2026-01-01",
        version: 1,
        created_at: "",
        file_url: null,
        issue_date: null,
        contractor_id: null,
      },
      {
        id: "cd2",
        doc_type: "LTCAT",
        title: "LTCAT",
        status: "active",
        expiration_date: "2026-02-01",
        version: 1,
        created_at: "",
        file_url: null,
        issue_date: null,
        contractor_id: "c1",
      },
      {
        id: "cd3",
        doc_type: "APR",
        title: "APR velha",
        status: "obsolete",
        expiration_date: "2020-01-01",
        version: 1,
        created_at: "",
        file_url: null,
        issue_date: null,
        contractor_id: null,
      },
    ];
    state.tables.employee_documents = [
      {
        id: "ed1",
        doc_type: "ASO",
        title: "ASO",
        status: "active",
        expiration_date: "2026-01-10",
        version: 1,
        created_at: "",
        file_url: null,
        issue_date: null,
        employee_id: "e1",
        employees: { name: "Maria Oliveira", contractor_id: null },
      },
    ];

    const docs = await carregarAlertasConsolidados();
    expect(docs).toHaveLength(3);

    const pgr = docs.find((d) => d.id === "cd1")!;
    expect(pgr.origem).toBe("empresa");
    expect(pgr.empresaTipo).toBe("propria");
    expect(pgr.empresaNome).toBe("Empresa Própria");

    const ltcat = docs.find((d) => d.id === "cd2")!;
    expect(ltcat.empresaTipo).toBe("terceirizada");
    expect(ltcat.empresaNome).toBe("MEC Empreendimentos");

    const aso = docs.find((d) => d.id === "ed1")!;
    expect(aso.origem).toBe("colaborador");
    expect(aso.colaboradorNome).toBe("Maria Oliveira");
    expect(aso.empresaTipo).toBe("propria");
  });
});

describe("agruparAlertas", () => {
  const hoje = new Date();
  const emDias = (n: number) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const doc = (over: Partial<DocumentoAlerta>): DocumentoAlerta => ({
    id: Math.random().toString(36).slice(2),
    doc_type: "ASO",
    title: "Doc",
    file_url: null,
    issue_date: null,
    expiration_date: null,
    status: "active",
    version: 1,
    created_at: "",
    origem: "empresa",
    tabela: "company_documents",
    tipos: [],
    empresaId: null,
    empresaNome: "Empresa Própria",
    empresaTipo: "propria",
    colaboradorNome: null,
    ...over,
  });

  it("agrupa por empresa (própria primeiro) e ordena por urgência", () => {
    const docs: DocumentoAlerta[] = [
      doc({ title: "Própria +3", expiration_date: emDias(3) }),
      doc({ title: "Própria vencida", expiration_date: emDias(-5) }),
      doc({
        title: "Terceirizada +1",
        expiration_date: emDias(1),
        empresaId: "c1",
        empresaNome: "MEC Empreendimentos",
        empresaTipo: "terceirizada",
      }),
    ];
    const grupos = agruparAlertas(docs, "todos");
    expect(grupos.map((g) => g.titulo)).toEqual([
      "Empresa Própria",
      "Terceirizada: MEC Empreendimentos",
    ]);
    // Dentro da empresa própria, a vencida (-5) vem antes da +3.
    expect(grupos[0]!.docs.map((d) => d.title)).toEqual(["Própria vencida", "Própria +3"]);
  });

  it("filtra por 'vencidos' e por 'vencem em 7 dias'", () => {
    const docs: DocumentoAlerta[] = [
      doc({ title: "Vencida", expiration_date: emDias(-2) }),
      doc({ title: "Em 5 dias", expiration_date: emDias(5) }),
      doc({ title: "Em 20 dias", expiration_date: emDias(20) }),
    ];
    const soDocs = (f: Parameters<typeof agruparAlertas>[1]) =>
      agruparAlertas(docs, f).flatMap((g) => g.docs.map((d) => d.title));
    expect(soDocs("vencidos")).toEqual(["Vencida"]);
    expect(soDocs("7").sort()).toEqual(["Em 5 dias"]);
    expect(soDocs("30").sort()).toEqual(["Em 20 dias", "Em 5 dias"]);
  });

  it("aplica a busca por título, tipo, colaborador ou empresa", () => {
    const docs: DocumentoAlerta[] = [
      doc({ title: "PGR", expiration_date: emDias(1) }),
      doc({
        title: "ASO",
        expiration_date: emDias(1),
        origem: "colaborador",
        colaboradorNome: "Maria Oliveira",
      }),
    ];
    const grupos = agruparAlertas(docs, "todos", "maria");
    expect(grupos).toHaveLength(1);
    expect(grupos[0]!.docs).toHaveLength(1);
    expect(grupos[0]!.docs[0]!.title).toBe("ASO");
  });
});

describe("rotuloEmpresa", () => {
  it("prefixa terceirizadas e mantém o nome da própria", () => {
    expect(rotuloEmpresa("propria", "Empresa Própria")).toBe("Empresa Própria");
    expect(rotuloEmpresa("terceirizada", "MEC")).toBe("Terceirizada: MEC");
  });
});

describe("nomeEmpresaPrincipal", () => {
  it("usa o nome da empresa quando é admin e o perfil já carregou", () => {
    expect(
      nomeEmpresaPrincipal({ adminPrincipal: true, carregando: false, empresa: "ACME Corp" }),
    ).toBe("ACME Corp");
  });

  it("recorta espaços em volta do nome", () => {
    expect(
      nomeEmpresaPrincipal({ adminPrincipal: true, carregando: false, empresa: "  ACME  " }),
    ).toBe("ACME");
  });

  it("mantém o padrão para usuários não administradores", () => {
    expect(
      nomeEmpresaPrincipal({ adminPrincipal: false, carregando: false, empresa: "ACME Corp" }),
    ).toBe("Empresa Própria");
  });

  it("mantém o padrão enquanto o perfil carrega", () => {
    expect(
      nomeEmpresaPrincipal({ adminPrincipal: true, carregando: true, empresa: "ACME Corp" }),
    ).toBe("Empresa Própria");
  });

  it("mantém o padrão quando não há empresa cadastrada", () => {
    expect(nomeEmpresaPrincipal({ adminPrincipal: true, carregando: false, empresa: null })).toBe(
      "Empresa Própria",
    );
    expect(nomeEmpresaPrincipal({ adminPrincipal: true, carregando: false, empresa: "   " })).toBe(
      "Empresa Própria",
    );
  });
});
