export type FiltroPrazo = "todos" | "vencidos" | "7" | "15" | "30";

/** Situação de validade calculada a partir da data de vencimento. */
export type Situacao = {
  nivel: "valido" | "atencao" | "vencido" | "sem-validade";
  rotulo: string;
  dias: number | null;
};

export type TomValidade = Situacao["nivel"];

export function digitosCpf(valor: string | null | undefined) {
  return (valor ?? "").replace(/\D/g, "");
}

export function formatarCpf(valor: string) {
  const digitos = digitosCpf(valor).slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function cpfValido(valor: string) {
  const cpf = digitosCpf(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calcular = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(9) === Number(cpf[9]) && calcular(10) === Number(cpf[10]);
}

export function mensagemCpfDuplicado(nome: string) {
  return `Já existe um cadastro com este CPF nesta empresa: ${nome}. Use o cadastro existente ou informe outro CPF.`;
}

export function encontrarColaboradorPorCpf<
  T extends { id: string; name: string; cpf: string | null },
>(colaboradores: readonly T[], cpf: string, ignorarId?: string) {
  const digitos = digitosCpf(cpf);
  if (digitos.length !== 11) return null;
  return (
    colaboradores.find(
      (colaborador) => colaborador.id !== ignorarId && digitosCpf(colaborador.cpf) === digitos,
    ) ?? null
  );
}

export function normalizarBusca(valor: string) {
  return valor.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, " ");
}

export function resolverFuncao(informada: string, conhecidas: readonly string[]) {
  const alvo = normalizarBusca(informada);
  const encontrada = conhecidas.find((nome) => normalizarBusca(nome) === alvo);
  if (encontrada) return { nome: encontrada, nova: false as const };
  return { nome: informada.trim().replace(/\s+/g, " ").slice(0, 80), nova: true as const };
}

export function situacaoDocumento(validade: string | null, referencia = new Date()): Situacao {
  if (!validade) return { nivel: "sem-validade", rotulo: "Sem validade", dias: null };
  const hoje = new Date(referencia);
  hoje.setHours(0, 0, 0, 0);
  const [a, m, d] = validade.split("-").map(Number);
  const fim = new Date(a ?? 0, (m ?? 1) - 1, d ?? 1);
  const dias = Math.round((fim.getTime() - hoje.getTime()) / 86_400_000);
  if (dias < 0) {
    const quantidade = Math.abs(dias);
    return {
      nivel: "vencido",
      rotulo: `CRÍTICO: Vencido há ${quantidade} ${quantidade === 1 ? "dia" : "dias"}`,
      dias,
    };
  }
  if (dias <= 30) {
    return {
      nivel: "atencao",
      rotulo:
        dias === 0
          ? "Atenção: Vence hoje"
          : `Atenção: Vence em ${dias} ${dias === 1 ? "dia" : "dias"}`,
      dias,
    };
  }
  return { nivel: "valido", rotulo: "Válido", dias };
}

export function rotuloContagemValidade(validade: string | null, referencia = new Date()) {
  const situacao = situacaoDocumento(validade, referencia);
  if (situacao.dias === null)
    return { texto: "Sem data de validade", tom: "sem-validade" as const };
  if (situacao.dias < 0) {
    const quantidade = Math.abs(situacao.dias);
    return {
      texto: `🔴 Vencido há ${quantidade} ${quantidade === 1 ? "dia" : "dias"}`,
      tom: "vencido" as const,
    };
  }
  if (situacao.dias === 0) return { texto: "🟡 Vence hoje", tom: "atencao" as const };
  if (situacao.dias <= 30) {
    return {
      texto: `🟡 Vence em ${situacao.dias} ${situacao.dias === 1 ? "dia" : "dias"}`,
      tom: "atencao" as const,
    };
  }
  return { texto: `🟢 Vence em ${situacao.dias} dias`, tom: "valido" as const };
}

export function resumoDocumentos(
  docs: readonly { status: string; expiration_date: string | null }[],
  referencia = new Date(),
) {
  const ativos = docs.filter((d) => d.status === "active");
  let aVencer = 0;
  let vencidos = 0;
  for (const d of ativos) {
    const s = situacaoDocumento(d.expiration_date, referencia);
    if (s.nivel === "atencao") aVencer++;
    if (s.nivel === "vencido") vencidos++;
  }
  return { total: ativos.length, aVencer, vencidos };
}

export function documentoNoFiltro(
  doc: { expiration_date: string | null },
  filtro: FiltroPrazo,
  referencia = new Date(),
) {
  if (filtro === "todos") return true;
  const situacao = situacaoDocumento(doc.expiration_date, referencia);
  if (filtro === "vencidos") return situacao.dias !== null && situacao.dias < 0;
  const limite = Number(filtro);
  return situacao.dias !== null && situacao.dias >= 0 && situacao.dias <= limite;
}

export function contagemAlertas(
  docs: readonly { status: string; expiration_date: string | null }[],
  referencia = new Date(),
) {
  const ativos = docs.filter((doc) => doc.status === "active");
  return {
    vencidos: ativos.filter((doc) => documentoNoFiltro(doc, "vencidos", referencia)).length,
    sete: ativos.filter((doc) => documentoNoFiltro(doc, "7", referencia)).length,
    quinze: ativos.filter((doc) => documentoNoFiltro(doc, "15", referencia)).length,
    trinta: ativos.filter((doc) => documentoNoFiltro(doc, "30", referencia)).length,
  };
}

export type ItemAgrupavel = {
  empresaChave: string;
  empresaRotulo: string;
  documento: { expiration_date: string | null; title: string };
};

export function agruparAlertas<T extends ItemAgrupavel>(
  itens: readonly T[],
  filtro: FiltroPrazo,
  referencia = new Date(),
) {
  const filtrados = itens.filter((item) => documentoNoFiltro(item.documento, filtro, referencia));
  const grupos = new Map<string, { chave: string; rotulo: string; itens: T[] }>();
  for (const item of filtrados) {
    const atual = grupos.get(item.empresaChave);
    if (atual) atual.itens.push(item);
    else {
      grupos.set(item.empresaChave, {
        chave: item.empresaChave,
        rotulo: item.empresaRotulo,
        itens: [item],
      });
    }
  }
  const lista = [...grupos.values()];
  for (const grupo of lista) {
    grupo.itens.sort((a, b) => {
      const diasA = situacaoDocumento(a.documento.expiration_date, referencia).dias;
      const diasB = situacaoDocumento(b.documento.expiration_date, referencia).dias;
      const urgenciaA = diasA === null ? Number.POSITIVE_INFINITY : diasA;
      const urgenciaB = diasB === null ? Number.POSITIVE_INFINITY : diasB;
      if (urgenciaA !== urgenciaB) return urgenciaA - urgenciaB;
      return a.documento.title.localeCompare(b.documento.title, "pt-BR");
    });
  }
  lista.sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
  return lista;
}

export const MODELO_CSV_COLABORADORES = "nome,cpf,funcao\nMaria Souza,390.533.447-05,Pedreiro\n";

export type LinhaPlanilhaColaborador =
  | {
      linha: number;
      status: "valida";
      name: string;
      cpf: string | null;
      role_title: string;
      funcaoNova: boolean;
    }
  | {
      linha: number;
      status: "erro";
      name: string;
      mensagem: string;
    };

type LinhaBruta = { numero: number; celulas: string[] };

const ALIAS_COLUNA: Record<string, "name" | "cpf" | "role"> = {
  nome: "name",
  name: "name",
  colaborador: "name",
  cpf: "cpf",
  funcao: "role",
  role: "role",
  roletitle: "role",
  cargo: "role",
};

function chaveColuna(valor: string) {
  const chave = normalizarBusca(valor).replace(/[^a-z0-9]/g, "");
  return ALIAS_COLUNA[chave] ?? null;
}

function contarSeparador(linha: string, separador: string) {
  let total = 0;
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const caractere = linha[i];
    if (caractere === '"') {
      if (aspas && linha[i + 1] === '"') i += 1;
      else aspas = !aspas;
    } else if (!aspas && caractere === separador) total += 1;
  }
  return total;
}

export function parseCsv(texto: string): LinhaBruta[] {
  const fonte = texto
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const primeira = fonte.split("\n").find((linha) => linha.trim()) ?? "";
  const separador = contarSeparador(primeira, ";") > contarSeparador(primeira, ",") ? ";" : ",";
  const linhas: LinhaBruta[] = [];
  let celulas: string[] = [];
  let campo = "";
  let aspas = false;
  let numero = 1;
  let inicio = 1;

  const fecharCampo = () => {
    celulas.push(campo.trim());
    campo = "";
  };
  const fecharLinha = () => {
    fecharCampo();
    if (celulas.some((celula) => celula.length > 0)) linhas.push({ numero: inicio, celulas });
    celulas = [];
    numero += 1;
    inicio = numero;
  };

  for (let i = 0; i < fonte.length; i++) {
    const caractere = fonte[i] ?? "";
    if (aspas) {
      if (caractere === '"') {
        if (fonte[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else aspas = false;
      } else {
        if (caractere === "\n") numero += 1;
        campo += caractere;
      }
    } else if (caractere === '"') aspas = true;
    else if (caractere === separador) fecharCampo();
    else if (caractere === "\n") fecharLinha();
    else campo += caractere;
  }

  if (campo.length > 0 || celulas.length > 0) {
    fecharCampo();
    if (celulas.some((celula) => celula.length > 0)) linhas.push({ numero: inicio, celulas });
  }
  return linhas;
}

export function analisarPlanilhaColaboradores(
  texto: string,
  contexto: {
    funcoesConhecidas: readonly string[];
    existentes: readonly { id: string; name: string; cpf: string | null }[];
  },
) {
  const brutas = parseCsv(texto);
  if (brutas.length === 0) {
    return {
      erroArquivo: "A planilha está vazia. Use as colunas nome, cpf e funcao.",
      linhas: [] as LinhaPlanilhaColaborador[],
    };
  }
  const cabecalho = brutas[0];
  if (!cabecalho) {
    return {
      erroArquivo: "A planilha está vazia. Use as colunas nome, cpf e funcao.",
      linhas: [] as LinhaPlanilhaColaborador[],
    };
  }
  const mapa = new Map<"name" | "cpf" | "role", number>();
  cabecalho.celulas.forEach((celula, indice) => {
    const chave = chaveColuna(celula);
    if (chave && !mapa.has(chave)) mapa.set(chave, indice);
  });
  const idxNome = mapa.get("name");
  const idxCpf = mapa.get("cpf");
  const idxFuncao = mapa.get("role");
  if (idxNome === undefined || idxCpf === undefined || idxFuncao === undefined) {
    return {
      erroArquivo: "Não encontrei as colunas obrigatórias. Use o cabeçalho: nome, cpf, funcao.",
      linhas: [] as LinhaPlanilhaColaborador[],
    };
  }
  const dados = brutas.slice(1);
  if (dados.length === 0) {
    return {
      erroArquivo: "A planilha não tem colaboradores para importar.",
      linhas: [] as LinhaPlanilhaColaborador[],
    };
  }

  const vistos = new Map<string, number>();
  const linhas: LinhaPlanilhaColaborador[] = [];
  for (const bruta of dados) {
    const name = (bruta.celulas[idxNome] ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
    const cpfBruto = (bruta.celulas[idxCpf] ?? "").trim();
    const funcaoBruta = bruta.celulas[idxFuncao] ?? "";
    if (!name) {
      linhas.push({
        linha: bruta.numero,
        status: "erro",
        name: "",
        mensagem: "Informe o nome do colaborador.",
      });
      continue;
    }
    let cpf: string | null = null;
    if (cpfBruto) {
      if (!cpfValido(cpfBruto)) {
        linhas.push({
          linha: bruta.numero,
          status: "erro",
          name,
          mensagem: "CPF inválido. Confira os números digitados.",
        });
        continue;
      }
      cpf = formatarCpf(cpfBruto);
      const digitos = digitosCpf(cpf);
      const linhaAnterior = vistos.get(digitos);
      if (linhaAnterior) {
        linhas.push({
          linha: bruta.numero,
          status: "erro",
          name,
          mensagem: `Este CPF já aparece na linha ${linhaAnterior} da planilha.`,
        });
        continue;
      }
      vistos.set(digitos, bruta.numero);
      const existente = encontrarColaboradorPorCpf(contexto.existentes, cpf);
      if (existente) {
        linhas.push({
          linha: bruta.numero,
          status: "erro",
          name,
          mensagem: mensagemCpfDuplicado(existente.name),
        });
        continue;
      }
    }
    const funcao = resolverFuncao(funcaoBruta, contexto.funcoesConhecidas);
    if (funcao.nome.trim().length < 2) {
      linhas.push({
        linha: bruta.numero,
        status: "erro",
        name,
        mensagem: "Selecione ou informe a função.",
      });
      continue;
    }
    linhas.push({
      linha: bruta.numero,
      status: "valida",
      name,
      cpf,
      role_title: funcao.nome,
      funcaoNova: funcao.nova,
    });
  }
  return { erroArquivo: null, linhas };
}
