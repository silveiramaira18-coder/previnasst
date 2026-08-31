import { jsPDF } from "jspdf";

import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarHora, listarNCsDaInspecao, obterInspecao } from "@/lib/db";
import { listarItens, resumoInspecao } from "@/lib/itens";
import { carregarPerfil } from "@/lib/perfil";

export type NivelRisco = "Crítico" | "Médio" | "Baixo";

export const NIVEIS_RISCO: NivelRisco[] = ["Crítico", "Médio", "Baixo"];

const CORES: Record<NivelRisco, [number, number, number]> = {
  Crítico: [220, 38, 38],
  Médio: [245, 158, 11],
  Baixo: [22, 163, 74],
};

/** Normaliza as severidades gravadas no banco para os três níveis do relatório. */
export function nivelRisco(severidade: string | null | undefined): NivelRisco {
  const v = (severidade ?? "").toLowerCase();
  if (v.startsWith("crít") || v.startsWith("crit") || v.startsWith("alt")) return "Crítico";
  if (v.startsWith("baix")) return "Baixo";
  return "Médio";
}

function desenharPizza(contagem: Record<NivelRisco, number>, total: number): string | null {
  if (typeof document === "undefined" || total === 0) return null;
  const size = 520;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const raio = size / 2 - 30;
  let inicio = -Math.PI / 2;

  for (const nivel of NIVEIS_RISCO) {
    const qtd = contagem[nivel];
    if (qtd === 0) continue;
    const angulo = (qtd / total) * Math.PI * 2;
    const [r, g, b] = CORES[nivel];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, raio, inicio, inicio + angulo);
    ctx.closePath();
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fill();

    const meio = inicio + angulo / 2;
    const tx = cx + Math.cos(meio) * raio * 0.62;
    const ty = cy + Math.sin(meio) * raio * 0.62;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round((qtd / total) * 100)}%`, tx, ty);
    inicio += angulo;
  }

  // Furo central (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, raio * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "bold 34px Helvetica, Arial, sans-serif";
  ctx.fillText(String(total), cx, cy - 12);
  ctx.font = "20px Helvetica, Arial, sans-serif";
  ctx.fillText("itens", cx, cy + 20);

  return canvas.toDataURL("image/png");
}

export async function gerarPdfInspecao(inspecaoId: string) {
  const [inspecao, itens, ncs, resumo, perfil] = await Promise.all([
    obterInspecao(inspecaoId),
    listarItens(inspecaoId),
    listarNCsDaInspecao(inspecaoId),
    resumoInspecao(inspecaoId),
    carregarPerfil(),
  ]);
  if (!inspecao) throw new Error("Inspeção não encontrada.");

  let empresa: string | null = null;
  if (inspecao.obra_id) {
    const { data } = await supabase
      .from("obras")
      .select("empresa, nome")
      .eq("id", inspecao.obra_id)
      .maybeSingle();
    empresa = data?.empresa ?? null;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margem = 40;
  const limite = larguraPagina - margem * 2;
  let y = margem;

  const novaPaginaSeNecessario = (altura: number) => {
    if (y + altura > alturaPagina - margem) {
      doc.addPage();
      y = margem;
    }
  };

  const linha = (texto: string, opcoes?: { size?: number; bold?: boolean; cor?: number[] }) => {
    const size = opcoes?.size ?? 10;
    doc.setFont("helvetica", opcoes?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    const [r, g, b] = opcoes?.cor ?? [17, 24, 39];
    doc.setTextColor(r ?? 0, g ?? 0, b ?? 0);
    const partes = doc.splitTextToSize(texto, limite) as string[];
    for (const parte of partes) {
      novaPaginaSeNecessario(size + 6);
      doc.text(parte, margem, y);
      y += size + 4;
    }
  };

  // Cabeçalho
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, larguraPagina, 86, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PREVINA SST", margem, 34);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Inspeção de Segurança do Trabalho", margem, 52);
  doc.setFontSize(10);
  doc.text(`Inspeção ${inspecao.numero}`, larguraPagina - margem, 34, { align: "right" });
  doc.text(`Emitido em ${formatarData(new Date().toISOString().slice(0, 10))}`, larguraPagina - margem, 52, {
    align: "right",
  });
  y = 110;

  linha("IDENTIFICAÇÃO", { bold: true, size: 12 });
  linha(`Empresa: ${empresa || "—"}`);
  linha(`Obra / local inspecionado: ${inspecao.obras?.nome ?? "—"}${inspecao.local ? ` — ${inspecao.local}` : ""}`);
  linha(`Data: ${formatarData(inspecao.data)}   Horário: ${formatarHora(inspecao.horario)}`);
  linha(`Tipo de inspeção: ${inspecao.tipo_inspecao ?? "—"}   Status: ${inspecao.status}`);
  y += 6;

  linha("PROFISSIONAL RESPONSÁVEL", { bold: true, size: 12 });
  linha(`Nome: ${perfil?.nome || inspecao.responsavel || "—"}`);
  linha(`E-mail: ${perfil?.email || "—"}`);
  linha(`Cargo: ${perfil?.cargo || "—"}`);
  linha(`Telefone: ${perfil?.telefone || "—"}`);
  y += 6;

  if (inspecao.observacoes) {
    linha("OBSERVAÇÕES GERAIS", { bold: true, size: 12 });
    linha(inspecao.observacoes);
    y += 6;
  }

  linha("RESUMO", { bold: true, size: 12 });
  linha(
    `Itens: ${resumo.total}   Conformes: ${resumo.conformes}   Não conformes: ${resumo.naoConformes}   Não se aplica: ${resumo.naoAplicaveis}   Conformidade: ${resumo.conformidade.toFixed(1)}%`,
  );
  y += 6;

  linha("ITENS DA INSPEÇÃO", { bold: true, size: 12 });
  if (itens.length === 0) linha("Nenhum item registrado.");
  itens.forEach((item) => {
    const nc = ncs.find((n) => n.item_inspecao_id === item.id);
    y += 4;
    linha(`Item ${item.numero} — ${item.categoria || "Sem categoria"}`, { bold: true });
    if (item.pergunta) linha(`Descrição: ${item.pergunta}`);
    linha(`Resposta: ${item.resposta ?? "Pendente"}`);
    if (item.observacao) linha(`Observação: ${item.observacao}`);
    if (nc) {
      linha(`Não conformidade (${nc.numero}): ${nc.descricao}`);
      linha(`Severidade: ${nc.severidade}   Prazo: ${nc.prazo ? formatarData(nc.prazo) : "—"}`);
      linha(`Responsável: ${nc.responsavel || "—"}`);
      if (nc.observacao) linha(`Medida de correção: ${nc.observacao}`);
    }
  });

  // Gráfico de severidades
  const contagem: Record<NivelRisco, number> = { Crítico: 0, Médio: 0, Baixo: 0 };
  ncs.forEach((n) => {
    contagem[nivelRisco(n.severidade)] += 1;
  });
  const totalNc = ncs.length;

  y += 14;
  novaPaginaSeNecessario(260);
  linha("DISTRIBUIÇÃO POR GRAU DE SEVERIDADE", { bold: true, size: 12 });

  if (totalNc === 0) {
    linha("Nenhuma não conformidade registrada nesta inspeção.");
  } else {
    const img = desenharPizza(contagem, totalNc);
    const topo = y + 6;
    if (img) doc.addImage(img, "PNG", margem, topo, 180, 180);
    let ly = topo + 24;
    for (const nivel of NIVEIS_RISCO) {
      const qtd = contagem[nivel];
      const pct = ((qtd / totalNc) * 100).toFixed(1);
      const [r, g, b] = CORES[nivel];
      doc.setFillColor(r, g, b);
      doc.rect(margem + 210, ly - 9, 12, 12, "F");
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Risco ${nivel}: ${pct}% (${qtd} ${qtd === 1 ? "item" : "itens"})`, margem + 230, ly);
      ly += 26;
    }
    y = topo + 200;
  }

  const nomeArquivo = `Relatorio_${inspecao.numero}_${(inspecao.obras?.nome ?? "inspecao")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`;

  doc.save(nomeArquivo);
  return nomeArquivo;
}
