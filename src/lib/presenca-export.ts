import { assinaturaInstrutor, linhasExportacao, nomePdfTreinamento } from "./presenca-regras";
import type { ListaPresenca, Participante } from "./presenca";

const dataFormatada = (v: string | null) => v ? v.split("-").reverse().join("/") : "—";
const escape = (v: string | null | undefined) => (v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
async function imagemLogo(url?: string | null): Promise<string | null> {
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar o logotipo.");
  const blob = await response.blob();
  const image = await createImageBitmap(blob);
  const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
  canvas.getContext("2d")?.drawImage(image, 0, 0); image.close();
  return canvas.toDataURL("image/png");
}

export async function baixarPdfLista(lista: ListaPresenca, participantes: Participante[], branco: boolean, logo?: string | null) {
  const [{ jsPDF }, { default: autoTable }, imagem] = await Promise.all([import("jspdf"), import("jspdf-autotable"), imagemLogo(logo)]);
  const pdf = new jsPDF({ orientation: "landscape", format: "a4" });
  const preto: [number, number, number] = [0, 0, 0];
  let y = 12;
  // Logo isolada à esquerda numa faixa própria; título começa abaixo dela, sem sobreposição.
  if (imagem) { const props = pdf.getImageProperties(imagem); const h = 16; const w = Math.min(50, h * props.width / props.height); pdf.addImage(imagem, "PNG", 12, y, w, h); y += h + 4; pdf.setDrawColor(0); pdf.setLineWidth(0.4); pdf.line(12, y, 285, y); y += 8; } else y += 4;
  pdf.setTextColor(0, 0, 0); pdf.setFont("helvetica", "bold"); pdf.setFontSize(17); pdf.text("LISTA DE TREINAMENTO", 148.5, y, { align: "center" }); y += 8;
  pdf.setFontSize(11); const titulo = pdf.splitTextToSize(lista.nome_treinamento || lista.tema, 267); pdf.text(titulo, 148.5, y, { align: "center" }); y += titulo.length * 5 + 4;
  autoTable(pdf, { startY: y, margin: 12, theme: "grid", head: [["EMPRESA", "LOCAL", "DATA", "HORÁRIO", "CARGA HORÁRIA"]], body: [[lista.empresa || "", lista.local || "", dataFormatada(lista.data), lista.horario || "", lista.carga_horaria || ""]], styles: { fontSize: 9.5, textColor: preto, lineColor: [60, 60, 60], lineWidth: 0.25, cellPadding: 2.6, fontStyle: "bold" }, headStyles: { fillColor: [225, 225, 225], textColor: preto, fontStyle: "bold", fontSize: 8.5 } });
  y = (pdf as typeof pdf & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  autoTable(pdf, { startY: y + 4, margin: 12, theme: "grid", head: [["DESCRIÇÃO / TEMA DO TREINAMENTO"]], body: [[lista.tema]], styles: { fontSize: 9.5, textColor: preto, lineColor: [60, 60, 60], lineWidth: 0.25, cellPadding: 2.6, fontStyle: "bold" }, headStyles: { fillColor: [225, 225, 225], textColor: preto, fontStyle: "bold", fontSize: 8.5 } });
  y = (pdf as typeof pdf & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  const linhas = linhasExportacao(participantes, branco, lista.modo_assinatura);
  autoTable(pdf, { startY: y + 5, margin: 12, theme: "grid", head: [["Nº", "NOME COMPLETO DO PARTICIPANTE", "FUNÇÃO / CARGO", "ASSINATURA"]], body: linhas.map((p, i) => [String(i + 1), p.nome, p.funcao || "", ""]), rowPageBreak: "avoid", styles: { fontSize: 9.5, minCellHeight: 11, valign: "middle", overflow: "linebreak", textColor: preto, lineColor: [60, 60, 60], lineWidth: 0.25, cellPadding: 2.6, fontStyle: "bold" }, headStyles: { fillColor: [225, 225, 225], textColor: preto, fontStyle: "bold", minCellHeight: 9, halign: "center" }, columnStyles: { 0: { cellWidth: 12, halign: "center" }, 1: { cellWidth: 112 }, 2: { cellWidth: 75 }, 3: { cellWidth: 74 } }, didDrawCell: hook => { const p = linhas[hook.row.index]; if (hook.section === "body" && hook.column.index === 3 && p?.assinatura) pdf.addImage(p.assinatura, "PNG", hook.cell.x + 2, hook.cell.y + 2, hook.cell.width - 4, hook.cell.height - 4); } });
  const assinatura = assinaturaInstrutor(lista, branco, lista.modo_assinatura);
  const fimParticipantes = (pdf as typeof pdf & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  // Rodapé: responsável/instrutor com nome, cargo e linha de assinatura (imagem digital quando houver).
  autoTable(pdf, { startY: fimParticipantes + 5, margin: 12, theme: "grid", head: [[{ content: "RESPONSÁVEL / INSTRUTOR (QUEM MINISTROU O TREINAMENTO)", colSpan: 2 }]], body: [[`NOME: ${lista.instrutor_nome || ""}`, `CARGO / FUNÇÃO: ${lista.instrutor_cargo || ""}`], ["ASSINATURA DO INSTRUTOR", ""]], rowPageBreak: "avoid", styles: { fontSize: 9.5, textColor: preto, lineColor: [60, 60, 60], lineWidth: 0.25, cellPadding: 2.6, fontStyle: "bold", valign: "middle" }, headStyles: { fillColor: [225, 225, 225], textColor: preto, fontStyle: "bold", fontSize: 8.5 }, columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 167 } }, didParseCell: hook => { if (hook.section === "body" && hook.row.index === 1) hook.cell.styles.minCellHeight = 22; }, didDrawCell: hook => { if (hook.section === "body" && hook.row.index === 1 && hook.column.index === 1 && assinatura) pdf.addImage(assinatura, "PNG", hook.cell.x + 2, hook.cell.y + 2, hook.cell.width - 4, hook.cell.height - 4); } });
  pdf.save(nomePdfTreinamento(lista.nome_treinamento || lista.tema));
}

export async function imprimirLista(lista: ListaPresenca, participantes: Participante[], branco: boolean, logo?: string | null) {
  const janela = window.open("", "_blank");
  if (!janela) throw new Error("Permita a abertura da janela de impressão no navegador.");
  try {
    const imagem = await imagemLogo(logo);
    const styles = getComputedStyle(document.documentElement);
    const token = (nome: string) => styles.getPropertyValue(nome).trim();
    const linhas = linhasExportacao(participantes, branco, lista.modo_assinatura);
    const assinatura = assinaturaInstrutor(lista, branco, lista.modo_assinatura);
    janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escape(nomePdfTreinamento(lista.nome_treinamento || lista.tema).replace(/\.pdf$/, ""))}</title><style>
      :root{--paper:${token("--paper")};--ink:${token("--paper-ink")};--border:${token("--paper-border")};--muted:${token("--paper-muted")}}
      @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;font-weight:500;color:#000;background:var(--paper);margin:0}h1,h2{text-align:center;letter-spacing:0}h1{font-size:20px;margin:0 0 6px}h2{font-size:14px;margin:0 0 12px}.head{border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:14px}.logo{display:block;max-width:180px;height:60px;object-fit:contain}h1,h2{color:#000;font-weight:800}table{width:100%;border-collapse:collapse;margin-bottom:12px}td,th{border:1px solid #333;padding:7px 9px;color:#000;overflow-wrap:anywhere}th{background:#e1e1e1;font-size:10px;font-weight:800;letter-spacing:.03em}td{font-weight:600}tr{break-inside:avoid}.info td{width:20%}.info b{display:block;font-size:10px}.tema{border:1px solid #333;font-weight:600;padding:8px;margin-bottom:12px;white-space:pre-wrap}.part td{height:42px}.part img{width:100%;height:32px;object-fit:contain}.part th:first-child{width:4%}.part th:nth-child(2){width:41%}.part th:nth-child(3){width:27%}.part th:last-child{width:28%}.instrutor{break-inside:avoid}.instrutor td{height:34px;vertical-align:middle}.instrutor td.assin{height:74px;vertical-align:bottom}.instrutor td.assin img{display:block;width:220px;height:54px;object-fit:contain}thead{display:table-header-group}@media print{body{margin:0}.tema,.info{break-inside:avoid}tr{break-inside:avoid}}
      </style></head><body>${imagem ? `<div class="head"><img class="logo" alt="Logotipo da empresa" src="${imagem}"></div>` : ""}<h1>LISTA DE TREINAMENTO</h1><h2>${escape(lista.nome_treinamento || lista.tema)}</h2><table class="info"><tr><td><b>EMPRESA</b>${escape(lista.empresa)}</td><td><b>LOCAL</b>${escape(lista.local)}</td><td><b>DATA</b>${dataFormatada(lista.data)}</td><td><b>HORÁRIO</b>${escape(lista.horario)}</td><td><b>CARGA HORÁRIA</b>${escape(lista.carga_horaria)}</td></tr></table><div class="tema"><b>DESCRIÇÃO / TEMA DO TREINAMENTO</b>\n${escape(lista.tema)}</div><table class="part"><thead><tr><th>Nº</th><th>NOME COMPLETO DO PARTICIPANTE</th><th>FUNÇÃO / CARGO</th><th>ASSINATURA</th></tr></thead><tbody>${linhas.map((p, i) => `<tr><td>${i + 1}</td><td>${escape(p.nome)}</td><td>${escape(p.funcao)}</td><td>${p.assinatura ? `<img alt="Assinatura" src="${escape(p.assinatura)}">` : ""}</td></tr>`).join("")}</tbody></table><table class="instrutor"><thead><tr><th colspan="2">RESPONSÁVEL / INSTRUTOR (QUEM MINISTROU O TREINAMENTO)</th></tr></thead><tbody><tr><td><b>NOME</b>${escape(lista.instrutor_nome)}</td><td><b>CARGO / FUNÇÃO</b>${escape(lista.instrutor_cargo)}</td></tr><tr><td colspan="2" class="assin"><b>ASSINATURA DO INSTRUTOR</b>${assinatura ? `<img alt="Assinatura do instrutor" src="${escape(assinatura)}">` : ""}</td></tr></tbody></table></body></html>`);
    janela.document.close();
    await Promise.all(Array.from(janela.document.images).map(img => img.decode().catch(() => undefined)));
    janela.focus(); janela.print();
  } catch (e) { janela.close(); throw e; }
}