import { jsPDF } from "jspdf";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  alertaPrazo,
  alertaPrazoDestaque,
  formatarData,
  formatarHora,
  listarNCsDaInspecao,
  listarNCsPendentesDaObra,
  obterInspecao,
  statusExibidoNC,
} from "@/lib/db";
import { enviarRelatorioParaDrive } from "@/lib/drive.functions";
import { listarFotos, urlAssinada } from "@/lib/fotos";
import { listarItens, resumoInspecao } from "@/lib/itens";
import { carregarPerfil } from "@/lib/perfil";

export type NivelRisco = "Crítico" | "Médio" | "Baixo";

export const NIVEIS_RISCO: NivelRisco[] = ["Crítico", "Médio", "Baixo"];

type RGB = [number, number, number];

/** Cores sólidas e saturadas — legíveis também em impressão P&B. */
const CORES: Record<NivelRisco, RGB> = {
  Crítico: [178, 22, 22],
  Médio: [176, 106, 8],
  Baixo: [21, 106, 58],
};

/** Cor do destaque de prazo: vermelho para atrasada/hoje, laranja para a vencer. */
const CorPrazo: Record<"vencida" | "hoje" | "prazo", RGB> = {
  vencida: [178, 22, 22],
  hoje: [178, 22, 22],
  prazo: [200, 118, 8],
};

const TINTA = {
  texto: [17, 20, 24] as RGB,
  rotulo: [87, 82, 74] as RGB,
  borda: [203, 200, 194] as RGB,
  fundoSuave: [244, 243, 240] as RGB,
  destaque: [233, 168, 56] as RGB,
  escuro: [17, 24, 39] as RGB,
  branco: [255, 255, 255] as RGB,
};

/** Normaliza as severidades gravadas no banco para os três níveis do relatório. */
export function nivelRisco(severidade: string | null | undefined): NivelRisco {
  const v = (severidade ?? "").toLowerCase();
  if (v.startsWith("crít") || v.startsWith("crit") || v.startsWith("alt")) return "Crítico";
  if (v.startsWith("baix")) return "Baixo";
  return "Médio";
}

/** Situação do prazo em relação à data atual. */
export function statusPrazo(prazo: string | null | undefined) {
  if (!prazo) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  const dia = prazo.slice(0, 10);
  if (dia < hoje) return "vencido";
  if (dia === hoje) return "vence hoje";
  return "no prazo";
}

async function carregarImagem(caminho: string) {
  const url = await urlAssinada(caminho);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Foto indisponível [${resp.status}]`);
  const blob = await resp.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.readAsDataURL(blob);
  });
  return { dataUrl, formato: blob.type.includes("png") ? "PNG" : "JPEG" };
}

/** Recorta a imagem no estilo object-fit: cover, mantendo a proporção original. */
async function recortarCover(dataUrl: string, larguraAlvo: number, alturaAlvo: number) {
  return await new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.max(larguraAlvo / img.width, alturaAlvo / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = larguraAlvo;
      canvas.height = alturaAlvo;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, larguraAlvo, alturaAlvo);
      const lg = img.width * escala;
      const al = img.height * escala;
      ctx.drawImage(img, (larguraAlvo - lg) / 2, (alturaAlvo - al) / 2, lg, al);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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
  let engenheiro: string | null = null;
  if (inspecao.obra_id) {
    const { data } = await supabase
      .from("obras")
      .select("empresa, nome, engenheiro_responsavel, responsavel")
      .eq("id", inspecao.obra_id)
      .maybeSingle();
    empresa = data?.empresa ?? null;
    engenheiro =
      (data as { engenheiro_responsavel?: string | null } | null)?.engenheiro_responsavel ?? null;
  }
  if (!engenheiro) {
    engenheiro =
      (inspecao as { engenheiro_responsavel?: string | null }).engenheiro_responsavel ?? null;
  }

  // Pendências de inspeções anteriores da mesma obra (não concluídas).
  const pendenciasAnteriores = inspecao.obra_id
    ? await listarNCsPendentesDaObra(inspecao.obra_id, inspecaoId)
    : [];

  // Pré-carrega as imagens de cada item para conseguir medir o bloco antes de desenhar.
  const imagensPorItem = new Map<string, { dataUrl: string; formato: string }>();
  await Promise.all(
    itens.map(async (item) => {
      try {
        const fotos = await listarFotos("fotos_item_inspecao", "item_inspecao_id", item.id);
        const primeira = fotos[0];
        if (!primeira) return;
        const bruta = await carregarImagem(primeira.url);
        imagensPorItem.set(item.id, {
          dataUrl: await recortarCover(bruta.dataUrl, 600, 448),
          formato: "JPEG",
        });
      } catch (erro) {
        console.error("Falha ao carregar foto do item", erro);
      }
    }),
  );

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margem = 40;
  const limite = larguraPagina - margem * 2;
  let y = margem;

  const cor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const fundo = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);

  const quebrarSeNecessario = (altura: number) => {
    if (y + altura > alturaPagina - margem) {
      doc.addPage();
      y = margem;
    }
  };

  const linha = (
    texto: string,
    opcoes?: { size?: number; bold?: boolean; cor?: RGB; largura?: number },
  ) => {
    const size = opcoes?.size ?? 10;
    doc.setFont("helvetica", opcoes?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    cor(opcoes?.cor ?? TINTA.texto);
    const partes = doc.splitTextToSize(texto, opcoes?.largura ?? limite) as string[];
    for (const parte of partes) {
      quebrarSeNecessario(size + 6);
      doc.text(parte, margem, y);
      y += size + 4;
    }
  };

  const titulo = (texto: string) => {
    quebrarSeNecessario(30);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    cor(TINTA.texto);
    doc.text(texto.toUpperCase(), margem, y);
    y += 6;
    fundo(TINTA.destaque);
    doc.rect(margem, y, 42, 2.5, "F");
    y += 16;
  };

  /** Par rótulo/valor com rótulo em cinza escuro (legível em P&B). */
  const campo = (rotulo: string, valor: string) => {
    quebrarSeNecessario(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    cor(TINTA.rotulo);
    doc.text(rotulo.toUpperCase(), margem, y);
    y += 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    cor(TINTA.texto);
    const partes = doc.splitTextToSize(valor || "—", limite) as string[];
    for (const parte of partes) {
      quebrarSeNecessario(14);
      doc.text(parte, margem, y);
      y += 13;
    }
    y += 4;
  };

  const chip = (texto: string, x: number, yy: number, fill: RGB, textoBranco = true) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const largura = doc.getTextWidth(texto.toUpperCase()) + 14;
    fundo(fill);
    doc.roundedRect(x, yy - 8.5, largura, 13, 3, 3, "F");
    cor(textoBranco ? TINTA.branco : TINTA.texto);
    doc.text(texto.toUpperCase(), x + 7, yy);
    return largura;
  };

  /* ---------------- Cabeçalho ---------------- */

  const nomeObra = inspecao.obras?.nome ?? "Obra não informada";
  fundo(TINTA.escuro);
  doc.rect(0, 0, larguraPagina, 108, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(198, 202, 210);
  doc.text("PREVINA SST", margem, 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  cor(TINTA.branco);
  const tituloBase = "Relatório de Inspeção de Segurança do Trabalho";
  const linhasTitulo = doc.splitTextToSize(tituloBase, limite - 130) as string[];
  let ty = 56;
  for (const parte of linhasTitulo) {
    doc.text(parte, margem, ty);
    ty += 22;
  }
  doc.setFontSize(15);
  cor(TINTA.destaque);
  const linhasObra = doc.splitTextToSize(`— ${nomeObra}`, limite) as string[];
  for (const parte of linhasObra) {
    doc.text(parte, margem, ty);
    ty += 18;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(198, 202, 210);
  doc.text(`Inspeção ${inspecao.numero}`, larguraPagina - margem, 32, { align: "right" });
  doc.text(
    `Emitido em ${formatarData(new Date().toISOString().slice(0, 10))}`,
    larguraPagina - margem,
    46,
    { align: "right" },
  );

  y = Math.max(132, ty + 16);

  /* ---------------- Resumo executivo ---------------- */

  const contagem: Record<NivelRisco, number> = { Crítico: 0, Médio: 0, Baixo: 0 };
  ncs.forEach((n) => {
    contagem[nivelRisco(n.severidade)] += 1;
  });
  const totalNc = ncs.length;
  const categorias = Array.from(
    new Set(
      ncs
        .map((n) => (n.categoria ?? "").trim())
        .filter((c): c is string => c.length > 0),
    ),
  );

  const executivo =
    totalNc === 0
      ? `Foram inspecionados ${resumo.total} ${resumo.total === 1 ? "item" : "itens"} na obra ${nomeObra}, sem registro de não conformidades. O índice de conformidade apurado foi de ${resumo.conformidade.toFixed(1)}%, indicando aderência aos requisitos de segurança verificados nesta inspeção.`
      : `Foram inspecionados ${resumo.total} ${resumo.total === 1 ? "item" : "itens"} na obra ${nomeObra}, com ${totalNc} ${totalNc === 1 ? "não conformidade registrada" : "não conformidades registradas"}, sendo ${contagem["Crítico"]} de risco crítico, ${contagem["Médio"]} de risco médio e ${contagem["Baixo"]} de risco baixo. O índice de conformidade apurado foi de ${resumo.conformidade.toFixed(1)}%.${
          categorias.length > 0
            ? ` As ocorrências concentram-se em: ${categorias.join(", ")}.`
            : ""
        } Recomenda-se tratativa imediata dos itens críticos dentro dos prazos definidos neste relatório.`;

  titulo("Resumo executivo");
  const alturaExec = (doc.splitTextToSize(executivo, limite - 24) as string[]).length * 13 + 22;
  quebrarSeNecessario(alturaExec);
  fundo(TINTA.fundoSuave);
  doc.setDrawColor(TINTA.borda[0], TINTA.borda[1], TINTA.borda[2]);
  doc.roundedRect(margem, y - 10, limite, alturaExec, 6, 6, "FD");
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  cor(TINTA.texto);
  for (const parte of doc.splitTextToSize(executivo, limite - 24) as string[]) {
    doc.text(parte, margem + 12, y);
    y += 13;
  }
  y += 10;

  /* ---------------- Resumo em cards ---------------- */

  titulo("Resumo da inspeção");
  const cards: { valor: string; rotulo: string; corValor?: RGB }[] = [
    { valor: String(resumo.total), rotulo: "Itens inspecionados" },
    { valor: String(resumo.conformes), rotulo: "Conformes" },
    { valor: String(resumo.naoConformes), rotulo: "Não conformes" },
    { valor: `${resumo.conformidade.toFixed(0)}%`, rotulo: "Conformidade" },
    {
      valor: String(resumo.ncsAtrasadas),
      rotulo: "NCs atrasadas",
      corValor: [178, 22, 22] as RGB,
    },
    { valor: String(resumo.ncsAVencer), rotulo: "NCs a vencer", corValor: [200, 118, 8] as RGB },
  ];
  const gapCards = 6;
  const largCard = (limite - gapCards * 5) / 6;
  quebrarSeNecessario(62);
  cards.forEach((c, i) => {
    const x = margem + i * (largCard + gapCards);
    fundo(TINTA.branco);
    if (c.corValor) doc.setDrawColor(c.corValor[0], c.corValor[1], c.corValor[2]);
    else doc.setDrawColor(TINTA.borda[0], TINTA.borda[1], TINTA.borda[2]);
    doc.roundedRect(x, y, largCard, 48, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    cor(c.corValor ?? TINTA.texto);
    doc.text(c.valor, x + largCard / 2, y + 24, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    cor(c.corValor ?? TINTA.rotulo);
    doc.text(c.rotulo.toUpperCase(), x + largCard / 2, y + 40, {
      align: "center",
      maxWidth: largCard - 6,
    });
  });
  y += 60;

  /* ---------------- Barra de severidade ---------------- */

  titulo("Distribuição por grau de severidade");
  if (totalNc === 0) {
    linha("Nenhuma não conformidade registrada nesta inspeção.");
    y += 4;
  } else {
    quebrarSeNecessario(70);
    const alturaBarra = 16;
    let x = margem;
    for (const nivel of NIVEIS_RISCO) {
      const qtd = contagem[nivel];
      if (qtd === 0) continue;
      const larg = (qtd / totalNc) * limite;
      fundo(CORES[nivel]);
      doc.rect(x, y, larg, alturaBarra, "F");
      if (larg > 26) {
        cor(TINTA.branco);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(`${Math.round((qtd / totalNc) * 100)}%`, x + larg / 2, y + 11, { align: "center" });
      }
      x += larg;
    }
    y += alturaBarra + 14;
    let lx = margem;
    for (const nivel of NIVEIS_RISCO) {
      const qtd = contagem[nivel];
      fundo(CORES[nivel]);
      doc.rect(lx, y - 8, 10, 10, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      cor(TINTA.texto);
      const texto = `${nivel}: ${qtd} (${((qtd / totalNc) * 100).toFixed(0)}%)`;
      doc.text(texto, lx + 15, y);
      lx += doc.getTextWidth(texto) + 34;
    }
    y += 14;
  }

  /* ---------------- Critério de classificação ---------------- */

  titulo("Critério de classificação");
  const criterios: [NivelRisco, string][] = [
    ["Crítico", "risco iminente de acidente grave ou óbito — exige ação imediata."],
    ["Médio", "risco relevante, sem iminência — correção dentro do prazo definido."],
    ["Baixo", "não conformidade administrativa ou de baixo potencial de dano."],
  ];
  for (const [nivel, texto] of criterios) {
    quebrarSeNecessario(18);
    const largChip = chip(nivel, margem, y, CORES[nivel]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    cor(TINTA.texto);
    doc.text(texto, margem + largChip + 8, y, { maxWidth: limite - largChip - 8 });
    y += 18;
  }
  y += 4;

  /* ---------------- Identificação ---------------- */

  titulo("Identificação da obra");
  campo("Empresa", empresa || "—");
  campo(
    "Obra / local inspecionado",
    `${nomeObra}${inspecao.local ? ` — ${inspecao.local}` : ""}`,
  );
  campo("Engenheiro responsável pela obra", engenheiro || "—");
  campo(
    "E-mail do engenheiro responsável",
    (inspecao as { email_engenheiro?: string | null }).email_engenheiro || "—",
  );
  campo("Data / horário", `${formatarData(inspecao.data)} · ${formatarHora(inspecao.horario)}`);
  campo("Tipo de inspeção", inspecao.tipo_inspecao ?? "—");

  /* -------- Profissional responsável: card único com duas colunas -------- */

  const nomeProf = perfil?.nome || inspecao.responsavel || "—";
  const cargoProf = perfil?.cargo || "—";
  const emailProf = perfil?.email || "—";
  const telProf = perfil?.telefone || "—";

  const colLarg = (limite - 36) / 2;
  const medir = (texto: string) =>
    (doc.splitTextToSize(texto, colLarg) as string[]).length;

  // Altura do card: a coluna mais alta entre esquerda (Nome/Cargo) e direita (Contato).
  const linhasEsq = medir(nomeProf) + medir(cargoProf);
  const linhasDir = medir(emailProf) + medir(telProf);
  const alturaProf = 22 + Math.max(linhasEsq, linhasDir) * 13 + 2 * 18 + 8;

  // O bloco inteiro fica junto: se não couber, começa na página seguinte.
  quebrarSeNecessario(alturaProf + 34);
  titulo("Profissional responsável pela inspeção");

  const topoProf = y - 6;
  fundo(TINTA.fundoSuave);
  doc.setDrawColor(TINTA.borda[0], TINTA.borda[1], TINTA.borda[2]);
  doc.roundedRect(margem, topoProf, limite, alturaProf, 6, 6, "FD");

  const parX = margem + 12;
  const dirX = margem + 24 + colLarg;

  /** Rótulo/valor dentro de uma coluna do card; devolve o novo y da coluna. */
  const campoColuna = (rotulo: string, valor: string, x: number, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    cor(TINTA.rotulo);
    doc.text(rotulo.toUpperCase(), x, yy);
    yy += 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    cor(TINTA.texto);
    for (const parte of doc.splitTextToSize(valor || "—", colLarg - 12) as string[]) {
      doc.text(parte, x, yy);
      yy += 13;
    }
    return yy + 6;
  };

  const yEsq = campoColuna("Nome", nomeProf, parX, topoProf + 18);
  campoColuna("Cargo", cargoProf, parX, yEsq);

  const yDir = campoColuna("Contato (e-mail)", emailProf, dirX, topoProf + 18);
  campoColuna("Contato (telefone)", telProf, dirX, yDir);

  y = topoProf + alturaProf + 12;

  /* ---------------- Quebra de página: inspeção começa no topo da página seguinte ---------------- */

  doc.addPage();
  y = margem;

  /* ---------------- Observações gerais (quadro destacado) ---------------- */

  if (inspecao.observacoes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    cor(TINTA.texto);
    const linhasObs = doc.splitTextToSize(inspecao.observacoes, limite - 24) as string[];
    const alturaObs = 30 + linhasObs.length * 13 + 14;
    fundo(TINTA.fundoSuave);
    doc.setDrawColor(TINTA.borda[0], TINTA.borda[1], TINTA.borda[2]);
    doc.roundedRect(margem, y, limite, alturaObs, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    cor(TINTA.destaque);
    doc.text("OBSERVAÇÕES GERAIS", margem + 12, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    cor(TINTA.texto);
    doc.text(linhasObs, margem + 12, y + 34);
    y += alturaObs + 16;
  }

  /* ---------------- Itens da inspeção (cards inquebráveis) ---------------- */

  titulo("PAVIMENTO/TIPO");
  if (itens.length === 0) linha("Nenhum item registrado.");

  const padCard = 12;
  const fotoLarg = 150;
  const fotoAlt = 112;

  for (const item of itens) {
    const nc = ncs.find((n) => n.item_inspecao_id === item.id);
    const nivel = nc ? nivelRisco(nc.severidade) : null;
    const corLateral: RGB = nivel ? CORES[nivel] : [120, 124, 130];
    const imagem = imagensPorItem.get(item.id);
    const larguraTexto = limite - padCard * 2 - 6 - (imagem ? fotoLarg + 12 : 0);

    const norma =
      (item as { norma_regulamentadora?: string | null }).norma_regulamentadora ?? null;
    const risco = (item as { risco_potencial?: string | null }).risco_potencial ?? null;
    const prazoTexto = nc?.prazo
      ? `${formatarData(nc.prazo)} · ${statusPrazo(nc.prazo)}`
      : "—";

    const campos: [string, string][] = [];
    if (nc) {
      const responsaveis =
        nc.responsaveis && nc.responsaveis.length > 0
          ? nc.responsaveis.join(", ")
          : nc.responsavel || "—";
      campos.push(["Responsável", responsaveis]);
      campos.push([
        "Status da NC",
        nc.status === "Concluída"
          ? "Concluída"
          : nc.acao_imediata
            ? "Parcialmente Concluída · Ação imediata concluída (risco sanado) · Ação definitiva pendente"
            : statusExibidoNC(nc),
      ]);
      if (nc.acao_imediata && nc.descricao_acao_imediata)
        campos.push(["Ação imediata realizada", nc.descricao_acao_imediata]);
      const alerta = alertaPrazo(nc);
      if (alerta)
        campos.push([
          alerta.tom === "vencida" ? "ATENÇÃO — prazo" : "Pendente — prazo",
          alerta.tom === "vencida"
            ? `NÃO CONFORMIDADE ATRASADA: ${alerta.texto.toUpperCase()} (prazo limite ${formatarData(nc.prazo)})`
            : `${alerta.texto.toUpperCase()} (data limite ${formatarData(nc.prazo)})`,
        ]);
      campos.push(["Prazo para correção", prazoTexto]);
      if (risco) campos.push(["Risco potencial", risco]);
      campos.push(["Não conformidade encontrada", nc.descricao]);
      if (nc.observacao) campos.push(["Medida de correção", nc.observacao]);
    } else if (risco) {
      campos.push(["Risco potencial", risco]);
    }
    if (!nc && item.observacao) campos.push(["Descrição / Observação", item.observacao]);

    // Medição do bloco inteiro (texto + foto) antes de desenhar → nunca quebra no meio.
    doc.setFontSize(11);
    let alturaTexto = 16; // título
    if (item.local) alturaTexto += 12;
    alturaTexto += 20; // linha de chips
    for (const [, valor] of campos) {
      doc.setFontSize(9.5);
      alturaTexto += 10 + (doc.splitTextToSize(valor || "—", larguraTexto) as string[]).length * 12 + 4;
    }
    const alturaCard = Math.max(alturaTexto, imagem ? fotoAlt + 14 : 0) + padCard * 2;

    if (y + alturaCard > alturaPagina - margem) {
      doc.addPage();
      y = margem;
    }

    const topo = y;
    fundo(TINTA.branco);
    doc.setDrawColor(TINTA.borda[0], TINTA.borda[1], TINTA.borda[2]);
    doc.roundedRect(margem, topo, limite, alturaCard, 8, 8, "FD");
    fundo(corLateral);
    doc.roundedRect(margem, topo, 6, alturaCard, 3, 3, "F");

    const xTexto = margem + padCard + 6;
    let cy = topo + padCard + 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    cor(TINTA.texto);
    doc.text(
      `Item ${String(item.numero).padStart(2, "0")}${item.categoria ? ` — ${item.categoria}` : ""}`,
      xTexto,
      cy,
      { maxWidth: larguraTexto },
    );
    cy += 14;

    if (item.local) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      cor(TINTA.rotulo);
      doc.text(item.local, xTexto, cy, { maxWidth: larguraTexto });
      cy += 12;
    }

    let cx = xTexto;
    const resposta = item.resposta ?? "Pendente";
    cx += chip(
      resposta,
      cx,
      cy + 4,
      resposta === "Conforme" ? CORES["Baixo"] : resposta === "Não conforme" ? CORES["Crítico"] : [120, 124, 130],
    ) + 6;
    if (nivel) cx += chip(`Risco ${nivel}`, cx, cy + 4, CORES[nivel]) + 6;
    const destaquePrazo = nc ? alertaPrazoDestaque(nc) : null;
    if (destaquePrazo) cx += chip(destaquePrazo.texto, cx, cy + 4, CorPrazo[destaquePrazo.tom]) + 6;
    if (norma) chip(norma, cx, cy + 4, TINTA.rotulo);
    cy += 20;

    for (const [rotulo, valor] of campos) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      cor(TINTA.rotulo);
      doc.text(rotulo.toUpperCase(), xTexto, cy);
      cy += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      cor(TINTA.texto);
      for (const parte of doc.splitTextToSize(valor || "—", larguraTexto) as string[]) {
        doc.text(parte, xTexto, cy);
        cy += 12;
      }
      cy += 4;
    }

    if (imagem) {
      try {
        doc.addImage(
          imagem.dataUrl,
          imagem.formato,
          margem + limite - padCard - fotoLarg,
          topo + padCard,
          fotoLarg,
          fotoAlt,
        );
      } catch (erro) {
        console.error("Falha ao embutir foto no PDF", erro);
      }
    }

    y = topo + alturaCard + 12;
  }

  /* ---------- Acompanhamento de pendências de inspeções anteriores ---------- */

  titulo("Acompanhamento de Pendências de Inspeções Anteriores");
  if (pendenciasAnteriores.length === 0) {
    linha("Não há não conformidades pendentes de inspeções anteriores nesta obra.");
    y += 4;
  } else {
    linha(
      `${pendenciasAnteriores.length} ${
        pendenciasAnteriores.length === 1
          ? "não conformidade registrada em inspeção anterior segue"
          : "não conformidades registradas em inspeções anteriores seguem"
      } sem conclusão até a data de emissão deste relatório.`,
      { cor: TINTA.rotulo },
    );
    y += 6;

    for (const nc of pendenciasAnteriores) {
      const nivelNc = nivelRisco(nc.severidade);
      const destaque = alertaPrazoDestaque(nc);
      const responsaveis =
        nc.responsaveis && nc.responsaveis.length > 0
          ? nc.responsaveis.join(", ")
          : nc.responsavel || "—";

      const camposNc: [string, string][] = [
        ["Não conformidade", nc.descricao],
        ["Origem", `Inspeção ${nc.inspecoes?.numero ?? "—"} de ${formatarData(nc.inspecoes?.data ?? null)}`],
        ["Responsável", responsaveis],
        ["Prazo para adequação", formatarData(nc.prazo)],
        ["Situação", statusExibidoNC(nc)],
      ];

      const largTexto = limite - padCard * 2 - 6;
      let alturaNc = 16 + 20;
      for (const [, valor] of camposNc) {
        doc.setFontSize(9.5);
        alturaNc += 10 + (doc.splitTextToSize(valor || "—", largTexto) as string[]).length * 12 + 4;
      }
      alturaNc += padCard * 2;

      if (y + alturaNc > alturaPagina - margem) {
        doc.addPage();
        y = margem;
      }

      const topoNc = y;
      fundo(TINTA.branco);
      doc.setDrawColor(TINTA.borda[0], TINTA.borda[1], TINTA.borda[2]);
      doc.roundedRect(margem, topoNc, limite, alturaNc, 8, 8, "FD");
      fundo(destaque ? CorPrazo[destaque.tom] : CORES[nivelNc]);
      doc.roundedRect(margem, topoNc, 6, alturaNc, 3, 3, "F");

      const xNc = margem + padCard + 6;
      let ny = topoNc + padCard + 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      cor(TINTA.texto);
      doc.text(
        `${nc.numero}${nc.categoria ? ` — ${nc.categoria}` : ""}`,
        xNc,
        ny,
        { maxWidth: largTexto },
      );
      ny += 14;

      let nx = xNc;
      nx += chip(`Risco ${nivelNc}`, nx, ny + 4, CORES[nivelNc]) + 6;
      if (destaque) chip(destaque.texto, nx, ny + 4, CorPrazo[destaque.tom]);
      ny += 20;

      for (const [rotulo, valor] of camposNc) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        cor(TINTA.rotulo);
        doc.text(rotulo.toUpperCase(), xNc, ny);
        ny += 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        cor(TINTA.texto);
        for (const parte of doc.splitTextToSize(valor || "—", largTexto) as string[]) {
          doc.text(parte, xNc, ny);
          ny += 12;
        }
        ny += 4;
      }

      y = topoNc + alturaNc + 12;
    }
  }

  /* ---------------- Validação e ciência ---------------- */

  const alturaValidacao = 165;
  if (y + alturaValidacao > alturaPagina - margem) {
    doc.addPage();
    y = margem;
  }
  titulo("Validação e ciência");

  const assinaturaImagem = (inspecao as { assinatura?: string | null }).assinatura ?? null;
  const assinaturaNome = (inspecao as { assinatura_nome?: string | null }).assinatura_nome ?? null;
  const assinaturaCargo =
    (inspecao as { assinatura_cargo?: string | null }).assinatura_cargo ?? null;
  const assinaturaData = (inspecao as { assinatura_data?: string | null }).assinatura_data ?? null;

  const largAss = (limite - 24) / 2;
  const assinaturas = [
    {
      titulo: "Técnico responsável pela inspeção",
      nome: assinaturaNome || perfil?.nome || inspecao.responsavel || "",
      detalhe: assinaturaCargo || perfil?.cargo || "",
      imagem: assinaturaImagem,
      dataAssinatura: assinaturaData,
    },
    {
      titulo: "Responsável pela obra — ciência do relatório",
      nome:
        (inspecao as { assinatura_obra_nome?: string | null }).assinatura_obra_nome ||
        engenheiro ||
        "",
      detalhe:
        (inspecao as { assinatura_obra_cargo?: string | null }).assinatura_obra_cargo || "",
      imagem: (inspecao as { assinatura_obra?: string | null }).assinatura_obra ?? null,
      dataAssinatura:
        (inspecao as { assinatura_obra_data?: string | null }).assinatura_obra_data ?? null,
    },
  ];

  assinaturas.forEach((a, i) => {
    const x = margem + i * (largAss + 24);
    const base = y + 46;
    if (a.imagem) {
      try {
        const alturaImg = 34;
        doc.addImage(a.imagem, "PNG", x, base - alturaImg - 10, largAss * 0.7, alturaImg);
      } catch (erro) {
        console.error(erro);
      }
    }
    doc.setDrawColor(TINTA.rotulo[0], TINTA.rotulo[1], TINTA.rotulo[2]);
    doc.setLineWidth(0.8);
    doc.line(x, base, x + largAss, base);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    cor(TINTA.texto);
    doc.text(a.nome || " ", x, base + 12, { maxWidth: largAss });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    cor(TINTA.rotulo);
    doc.text(a.titulo.toUpperCase(), x, base + 24, { maxWidth: largAss });
    if (a.detalhe) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(a.detalhe, x, base + 36, { maxWidth: largAss });
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    cor(TINTA.rotulo);
    doc.text(
      a.dataAssinatura
        ? `Assinado eletronicamente em ${new Date(a.dataAssinatura).toLocaleString("pt-BR")}`
        : "Data: ____ / ____ / ________",
      x,
      base + 50,
      { maxWidth: largAss },
    );
  });
  y += 130;

  const nomeArquivo = `Relatorio_${inspecao.numero}_${nomeObra
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`;

  doc.save(nomeArquivo);

  // Envio automático para o Google Drive (pasta da empresa)
  try {
    const dataUri = doc.output("datauristring");
    const pdfBase64 = dataUri.slice(dataUri.indexOf(",") + 1);
    await enviarRelatorioParaDrive({
      data: { nomeArquivo, empresa: empresa || nomeObra, pdfBase64 },
    });
    toast.success("Relatório salvo no Google Drive", { description: nomeArquivo });
  } catch (erro) {
    console.error(erro);
    toast.error("Não foi possível enviar o relatório ao Google Drive", {
      description: erro instanceof Error ? erro.message : undefined,
    });
  }

  return nomeArquivo;
}
