import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { calcularCargaHoraria, linhasExportacao, nomePdfTreinamento, podeEditarLista } from "./presenca-regras";

const expect = (actual: unknown) => ({ toBe: (expected: unknown) => assert.equal(actual, expected), toBeNull: () => assert.equal(actual, null) });

describe("Regras de listas de treinamento", () => {
  test("07:30 a 11:30 corresponde a 4h", () => expect(calcularCargaHoraria("07:30", "11:30")).toBe("4h"));
  test("preserva minutos", () => expect(calcularCargaHoraria("07:30", "09:45")).toBe("2h 15min"));
  test("não calcula horários inválidos ou fim anterior", () => { expect(calcularCargaHoraria("", "11:30")).toBe(""); expect(calcularCargaHoraria("12:00", "11:00")).toBe(""); });
  test("PDF usa prefixo solicitado e nome higienizado", () => expect(nomePdfTreinamento('DDS - DIÁLOGO / SEGURANÇA')).toBe("Lista de Treinamento - DDS - DIALOGO SEGURANCA.pdf"));
  test("em branco não exporta participantes ou assinaturas", () => expect(linhasExportacao([{ nome: "ANA", funcao: "TST", assinatura: "imagem" }], true, "digital").every(p => !p.nome && !p.funcao && !p.assinatura)).toBe(true));
  test("completa digital conserva assinatura", () => expect(linhasExportacao([{ nome: "ANA", funcao: "TST", assinatura: "imagem" }], false, "digital")[0]?.assinatura).toBe("imagem"));
  test("modo manual omite assinatura digital sem apagar o original", () => expect(linhasExportacao([{ nome: "ANA", funcao: "TST", assinatura: "imagem" }], false, "manual")[0]?.assinatura).toBeNull());
  test("somente autor ou administradora podem editar", () => { expect(podeEditarLista("autor", "autor", false)).toBe(true); expect(podeEditarLista("outro", "autor", false)).toBe(false); expect(podeEditarLista("admin", "autor", true)).toBe(true); expect(podeEditarLista(undefined, "autor", true)).toBe(false); });
});