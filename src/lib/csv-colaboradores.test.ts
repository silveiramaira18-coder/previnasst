import { describe, expect, it } from "bun:test";

import {
  acharColuna,
  casarFuncao,
  extrairLinhasColaboradores,
  parseCsv,
  semAcento,
} from "@/lib/csv-colaboradores";

describe("parseCsv", () => {
  it("detecta o delimitador ponto e vírgula e ignora linhas vazias", () => {
    const linhas = parseCsv("Nome;CPF\r\nAna;123\r\n\r\nBruno;456\r\n");
    expect(linhas).toEqual([
      ["Nome", "CPF"],
      ["Ana", "123"],
      ["Bruno", "456"],
    ]);
  });

  it("respeita campos entre aspas com delimitador e aspas escapadas", () => {
    const linhas = parseCsv('Nome,Obs\n"Silva, Ana","diz ""oi"""\n');
    expect(linhas).toEqual([
      ["Nome", "Obs"],
      ["Silva, Ana", 'diz "oi"'],
    ]);
  });

  it("aceita tabulação como delimitador", () => {
    expect(parseCsv("a\tb\tc")).toEqual([["a", "b", "c"]]);
  });
});

describe("semAcento / acharColuna", () => {
  it("normaliza acentos e caixa", () => {
    expect(semAcento("  Função ")).toBe("funcao");
  });

  it("encontra a coluna ignorando acentos e caixa", () => {
    const cabecalho = ["Nome", "CPF", "Função"];
    expect(acharColuna(cabecalho, ["funcao", "cargo"])).toBe(2);
    expect(acharColuna(cabecalho, ["email"])).toBe(-1);
  });
});

describe("extrairLinhasColaboradores", () => {
  it("mapeia nome, cpf e função pelo cabeçalho (com acento)", () => {
    const linhas = extrairLinhasColaboradores(
      "Nome;CPF;Função\nAna Souza;529.982.247-25;Pedreiro\n",
    );
    expect(linhas).toEqual([
      { linha: 2, nome: "Ana Souza", cpf: "529.982.247-25", funcao: "Pedreiro" },
    ]);
  });

  it("preenche campos ausentes quando não há coluna de CPF/função", () => {
    const linhas = extrairLinhasColaboradores("Nome\nCarlos\n");
    expect(linhas).toEqual([{ linha: 2, nome: "Carlos", cpf: "", funcao: "" }]);
  });

  it("lança erro quando falta a coluna Nome", () => {
    expect(() => extrairLinhasColaboradores("CPF;Funcao\n123;Pedreiro")).toThrow(/Nome/);
  });

  it("lança erro quando não há linhas de dados", () => {
    expect(() => extrairLinhasColaboradores("Nome;CPF")).toThrow(/cabeçalho/);
  });
});

describe("casarFuncao", () => {
  const conhecidas = ["Engenheiro Civil", "Pedreiro", "Técnico de Segurança do Trabalho"];

  it("reaproveita a função existente ignorando acento/caixa", () => {
    expect(casarFuncao("engenheiro civil", conhecidas)).toBe("Engenheiro Civil");
    expect(casarFuncao("TECNICO DE SEGURANCA DO TRABALHO", conhecidas)).toBe(
      "Técnico de Segurança do Trabalho",
    );
  });

  it("mantém o texto informado quando não há correspondência", () => {
    expect(casarFuncao("Vigia noturno", conhecidas)).toBe("Vigia noturno");
  });

  it("devolve string vazia para função vazia", () => {
    expect(casarFuncao("   ", conhecidas)).toBe("");
  });
});
