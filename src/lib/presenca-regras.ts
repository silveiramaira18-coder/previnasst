export function calcularCargaHoraria(inicio: string, fim: string): string {
  const hora = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? Number(v.slice(0, 2)) * 60 + Number(v.slice(3)) : null;
  const a = hora(inicio), b = hora(fim);
  if (a === null || b === null || b < a) return "";
  // Desconta 1h de almoço quando o período abrange todo o intervalo 12:00–13:00.
  const minutos = b - a - (a <= 720 && b >= 780 ? 60 : 0);
  return `${Math.floor(minutos / 60)}h${minutos % 60 ? ` ${minutos % 60}min` : ""}`;
}

export function nomePdfTreinamento(nome: string): string {
  const limpo = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\\/:*?"<>|\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
  return `Lista de Treinamento - ${limpo || "Treinamento"}.pdf`;
}

export function linhasExportacao<T extends { nome: string; funcao: string | null; assinatura?: string | null }>(participantes: T[], branco: boolean, modo: "digital" | "manual") {
  if (branco) return Array.from({ length: Math.max(10, participantes.length) }, () => ({ nome: "", funcao: "", assinatura: null }));
  return participantes.map(p => ({ nome: p.nome, funcao: p.funcao, assinatura: modo === "digital" ? p.assinatura ?? null : null }));
}

export function podeEditarLista(userId: string | undefined, owner: string, admin: boolean) {
  return !!userId && (userId === owner || admin);
}

export const TODAS_OBRAS = "todas";

export type FiltroListas = { obra: string; busca: string; de: string; ate: string };

export const FILTRO_LISTAS_VAZIO: FiltroListas = { obra: TODAS_OBRAS, busca: "", de: "", ate: "" };

const normalizar = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const ordenar = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

/** Mantém somente as listas que atendem a todos os filtros preenchidos. */
export function filtrarListas<T extends { local: string | null; data: string | null; nome_treinamento: string | null; tema: string }>(listas: T[], filtro: FiltroListas): T[] {
  const busca = normalizar(filtro.busca);
  return listas.filter(lista => {
    if (filtro.obra !== TODAS_OBRAS && normalizar(lista.local ?? "") !== normalizar(filtro.obra)) return false;
    if (busca && !normalizar(`${lista.nome_treinamento ?? ""} ${lista.tema}`).includes(busca)) return false;
    if (filtro.de && (!lista.data || lista.data < filtro.de)) return false;
    if (filtro.ate && (!lista.data || lista.data > filtro.ate)) return false;
    return true;
  });
}

/** Obras (locais) já usadas nas listas, sem repetição e em ordem alfabética. */
export function obrasDasListas<T extends { local: string | null }>(listas: T[]): string[] {
  return [...new Set(listas.map(l => (l.local ?? "").trim()).filter(Boolean))].sort(ordenar);
}