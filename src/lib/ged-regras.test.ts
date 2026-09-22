import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  agruparAlertas,
  analisarPlanilhaColaboradores,
  cpfValido,
  documentoNoFiltro,
  encontrarColaboradorPorCpf,
  formatarCpf,
  mensagemCpfDuplicado,
  MODELO_CSV_COLABORADORES,
  rotuloContagemValidade,
} from "./ged-regras.ts";

const HOJE = new Date(2026, 8, 22);

describe("CPF", () => {
  it("aceita CPF válido e rejeita sequência inválida", () => {
    assert.equal(cpfValido("390.533.447-05"), true);
    assert.equal(cpfValido("39053344705"), true);
    assert.equal(cpfValido("111.111.111-11"), false);
    assert.equal(cpfValido("390.533.447-06"), false);
    assert.equal(formatarCpf("39053344705"), "390.533.447-05");
  });

  it("encontra cadastro da mesma empresa ignorando máscara e o próprio registro", () => {
    const lista = [
      { id: "1", name: "Ana Lima", cpf: "390.533.447-05" },
      { id: "2", name: "Bruno", cpf: null },
    ];
    assert.equal(encontrarColaboradorPorCpf(lista, "39053344705")?.name, "Ana Lima");
    assert.equal(encontrarColaboradorPorCpf(lista, "390.533.447-05", "1"), null);
    assert.equal(encontrarColaboradorPorCpf(lista, ""), null);
    assert.match(mensagemCpfDuplicado("Ana Lima"), /Ana Lima/);
    assert.match(mensagemCpfDuplicado("Ana Lima"), /nesta empresa/);
  });
});

describe("planilha de colaboradores", () => {
  const funcoes = ["Pedreiro", "Técnico de edificações"];

  it("valida o modelo e reaproveita função já conhecida", () => {
    const resultado = analisarPlanilhaColaboradores(MODELO_CSV_COLABORADORES, {
      funcoesConhecidas: funcoes,
      existentes: [],
    });
    assert.equal(resultado.erroArquivo, null);
    assert.equal(resultado.linhas.length, 1);
    const linha = resultado.linhas[0];
    assert.ok(linha && linha.status === "valida");
    if (linha?.status === "valida") {
      assert.equal(linha.name, "Maria Souza");
      assert.equal(linha.cpf, "390.533.447-05");
      assert.equal(linha.role_title, "Pedreiro");
      assert.equal(linha.funcaoNova, false);
    }
  });

  it("aceita ponto e vírgula, função personalizada e nome com vírgula", () => {
    const texto = [
      "nome;cpf;função",
      '"Silva, João";39053344705;tecnico de edificacoes',
      "Carla Dias;;Topógrafo",
    ].join("\n");
    const resultado = analisarPlanilhaColaboradores(`\uFEFF${texto}`, {
      funcoesConhecidas: funcoes,
      existentes: [],
    });
    assert.equal(resultado.erroArquivo, null);
    const [joao, carla] = resultado.linhas;
    assert.ok(joao && joao.status === "valida" && joao.role_title === "Técnico de edificações");
    assert.equal(joao && joao.status === "valida" ? joao.funcaoNova : true, false);
    assert.ok(carla && carla.status === "valida" && carla.funcaoNova && carla.cpf === null);
    assert.equal(carla && carla.status === "valida" ? carla.role_title : "", "Topógrafo");
  });

  it("bloqueia CPF inválido, repetido na planilha e já cadastrado na empresa", () => {
    const texto = [
      "nome,cpf,funcao",
      "Sem Funcao,390.533.447-05,",
      "Invalido,111.111.111-11,Pedreiro",
      "Repetido,390.533.447-05,Pedreiro",
      "Ja Existe,529.982.247-25,Pedreiro",
    ].join("\n");
    const resultado = analisarPlanilhaColaboradores(texto, {
      funcoesConhecidas: funcoes,
      existentes: [{ id: "9", name: "Paulo Nunes", cpf: "52998224725" }],
    });
    assert.deepEqual(
      resultado.linhas.map((linha) => (linha.status === "erro" ? linha.mensagem : linha.status)),
      [
        "Selecione ou informe a função.",
        "CPF inválido. Confira os números digitados.",
        "Este CPF já aparece na linha 2 da planilha.",
        mensagemCpfDuplicado("Paulo Nunes"),
      ],
    );
  });
});

describe("painel de alertas", () => {
  const itens = [
    item("propria", "Empresa Própria: Matriz", "PGR antigo", "2026-09-01"),
    item("propria", "Empresa Própria: Matriz", "PCMSO", "2026-10-30"),
    item("mec", "Terceirizada: MEC Empreendimentos", "ASO", "2026-09-10"),
    item("mec", "Terceirizada: MEC Empreendimentos", "Treinamento NR-35", "2026-09-24"),
    item("mec", "Terceirizada: MEC Empreendimentos", "Ficha sem validade", null),
  ];

  it("agrupa por empresa e ordena do vencimento mais urgente ao mais distante", () => {
    const grupos = agruparAlertas(itens, "todos", HOJE);
    assert.deepEqual(
      grupos.map((grupo) => [grupo.rotulo, grupo.itens.map((entrada) => entrada.documento.title)]),
      [
        ["Empresa Própria: Matriz", ["PGR antigo", "PCMSO"]],
        ["Terceirizada: MEC Empreendimentos", ["ASO", "Treinamento NR-35", "Ficha sem validade"]],
      ],
    );
  });

  it("filtra vencidos e janelas futuras sem misturar empresas", () => {
    assert.deepEqual(titulos(agruparAlertas(itens, "vencidos", HOJE)), ["PGR antigo", "ASO"]);
    assert.deepEqual(titulos(agruparAlertas(itens, "7", HOJE)), ["Treinamento NR-35"]);
    assert.deepEqual(titulos(agruparAlertas(itens, "30", HOJE)), ["Treinamento NR-35"]);
    assert.equal(documentoNoFiltro({ expiration_date: "2026-09-10" }, "7", HOJE), false);
  });

  it("mostra a contagem exata no badge", () => {
    assert.equal(rotuloContagemValidade("2026-09-19", HOJE).texto, "🔴 Vencido há 3 dias");
    assert.equal(rotuloContagemValidade("2026-09-21", HOJE).texto, "🔴 Vencido há 1 dia");
    assert.equal(rotuloContagemValidade("2026-09-22", HOJE).texto, "🟡 Vence hoje");
    assert.equal(rotuloContagemValidade("2026-09-24", HOJE).texto, "🟡 Vence em 2 dias");
    assert.equal(rotuloContagemValidade("2026-09-23", HOJE).texto, "🟡 Vence em 1 dia");
  });
});

function item(
  empresaChave: string,
  empresaRotulo: string,
  title: string,
  expiration_date: string | null,
) {
  return { empresaChave, empresaRotulo, documento: { title, expiration_date } };
}

function titulos(grupos: { itens: { documento: { title: string } }[] }[]) {
  return grupos.flatMap((grupo) => grupo.itens.map((entrada) => entrada.documento.title));
}
