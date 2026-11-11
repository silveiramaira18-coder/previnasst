import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { calcularCargaHoraria, linhasExportacao, nomePdfTreinamento, podeEditarLista, FILTRO_LISTAS_VAZIO, TODAS_OBRAS, filtrarListas, obrasDasListas } from "./presenca-regras";

const expect = (actual: unknown) => ({ toBe: (expected: unknown) => assert.equal(actual, expected), toBeNull: () => assert.equal(actual, null) });

describe("Regras de listas de treinamento", () => {
  test("07:30 a 11:30 corresponde a 4h", () => expect(calcularCargaHoraria("07:30", "11:30")).toBe("4h"));
  test("dia todo 07:00 a 17:00 desconta 1h de almoço", () => expect(calcularCargaHoraria("07:00", "17:00")).toBe("9h"));
  test("período que não abrange o almoço inteiro não desconta", () => expect(calcularCargaHoraria("08:00", "12:30")).toBe("4h 30min"));
  test("preserva minutos", () => expect(calcularCargaHoraria("07:30", "09:45")).toBe("2h 15min"));
  test("não calcula horários inválidos ou fim anterior", () => { expect(calcularCargaHoraria("", "11:30")).toBe(""); expect(calcularCargaHoraria("12:00", "11:00")).toBe(""); });
  test("PDF usa prefixo solicitado e nome higienizado", () => expect(nomePdfTreinamento('DDS - DIÁLOGO / SEGURANÇA')).toBe("Lista de Treinamento - DDS - DIALOGO SEGURANCA.pdf"));
  test("em branco não exporta participantes ou assinaturas", () => expect(linhasExportacao([{ nome: "ANA", funcao: "TST", assinatura: "imagem" }], true, "digital").every(p => !p.nome && !p.funcao && !p.assinatura)).toBe(true));
  test("completa digital conserva assinatura", () => expect(linhasExportacao([{ nome: "ANA", funcao: "TST", assinatura: "imagem" }], false, "digital")[0]?.assinatura).toBe("imagem"));
  test("modo manual omite assinatura digital sem apagar o original", () => expect(linhasExportacao([{ nome: "ANA", funcao: "TST", assinatura: "imagem" }], false, "manual")[0]?.assinatura).toBeNull());
  test("somente autor ou administradora podem editar", () => { expect(podeEditarLista("autor", "autor", false)).toBe(true); expect(podeEditarLista("outro", "autor", false)).toBe(false); expect(podeEditarLista("admin", "autor", true)).toBe(true); expect(podeEditarLista(undefined, "autor", true)).toBe(false); });

  const lista = (nome: string, local: string | null, data: string | null) => ({ local, data, nome_treinamento: nome, tema: nome });
  const amostra = [
    lista("NR-35 - Trabalho em Altura", "Condomínio Aurora", "2026-05-10"),
    lista("DDS - Uso de EPI", "Condomínio Aurora", "2026-05-20"),
    lista("Integração de NR", "Obra Beta", "2026-06-01"),
  ];
  test("filtro vazio mantém todas as listas", () => expect(filtrarListas(amostra, FILTRO_LISTAS_VAZIO).length).toBe(3));
  test("obra é comparada sem acento e sem diferenciar maiúsculas", () => expect(filtrarListas(amostra, { ...FILTRO_LISTAS_VAZIO, obra: "condominio aurora" }).map(l => l.nome_treinamento)).toEqual(["NR-35 - Trabalho em Altura", "DDS - Uso de EPI"]));
  test("nome do treinamento aceita busca parcial no nome e no tema", () => expect(filtrarListas(amostra, { ...FILTRO_LISTAS_VAZIO, busca: "epi" }).map(l => l.nome_treinamento)).toEqual(["DDS - Uso de EPI"]));
  test("intervalo de datas é inclusivo nas duas pontas", () => expect(filtrarListas(amostra, { ...FILTRO_LISTAS_VAZIO, de: "2026-05-10", ate: "2026-05-10" }).map(l => l.nome_treinamento)).toEqual(["NR-35 - Trabalho em Altura"]));
  test("lista sem data some quando há filtro de data", () => expect(filtrarListas([...amostra, lista("Sem Data", "Obra Beta", null)], { ...FILTRO_LISTAS_VAZIO, de: "2026-01-01" }).length).toBe(3));
  test("filtros combinados de obra e nome somam", () => expect(filtrarListas(amostra, { obra: "Condomínio Aurora", busca: "altura", de: "", ate: "" }).length).toBe(1));
  test("obras do filtro saem sem repetição, sem vazias e em ordem alfabética", () => expect(obrasDasListas([...amostra, lista("Outra", "Condomínio Aurora", "2026-07-01"), lista("Sem Local", null, "2026-07-01")])).toEqual(["Condomínio Aurora", "Obra Beta"]));
  test("todas as obras é o valor inicial do filtro", () => expect(FILTRO_LISTAS_VAZIO.obra).toBe(TODAS_OBRAS));
});