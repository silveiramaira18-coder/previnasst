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