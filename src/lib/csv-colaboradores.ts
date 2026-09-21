/** Utilitários puros para importação de colaboradores via planilha CSV. */

export type LinhaColaboradorCsv = {
  linha: number;
  nome: string;
  cpf: string;
  funcao: string;
};

/** Divide o conteúdo do CSV em linhas/colunas tolerando aspas e delimitadores ; , ou tab. */
export function parseCsv(texto: string): string[][] {
  const limpo = texto.replace(/^\uFEFF/, "");
  const primeiraLinha = limpo.split(/\r?\n/, 1)[0] ?? "";
  const delimitador = ([";", "\t", ","] as const)
    .map((d) => ({ d, n: primeiraLinha.split(d).length }))
    .sort((a, b) => b.n - a.n)[0]!.d;

  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let entreAspas = false;

  for (let i = 0; i < limpo.length; i++) {
    const char = limpo[i];
    if (entreAspas) {
      if (char === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreAspas = false;
        }
      } else {
        campo += char;
      }
      continue;
    }
    if (char === '"') {
      entreAspas = true;
    } else if (char === delimitador) {
      linha.push(campo);
      campo = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && limpo[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else {
      campo += char;
    }
  }
  if (campo.length > 0 || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

/** Texto minúsculo, sem acentos e sem espaços nas pontas — usado para comparações. */
export function semAcento(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/** Localiza a coluna cujo cabeçalho casa com qualquer um dos rótulos aceitos. */
export function acharColuna(cabecalho: string[], candidatos: string[]) {
  const normalizado = cabecalho.map(semAcento);
  for (const c of candidatos) {
    const i = normalizado.indexOf(c);
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * Lê o CSV e extrai as linhas de colaboradores (nome, CPF e função) já mapeadas
 * pelas colunas do cabeçalho. Lança erro quando a estrutura mínima não existe.
 */
export function extrairLinhasColaboradores(texto: string): LinhaColaboradorCsv[] {
  const linhas = parseCsv(texto);
  if (linhas.length < 2) {
    throw new Error("A planilha precisa de um cabeçalho e ao menos uma linha de dados.");
  }
  const cabecalho = linhas[0]!;
  const iNome = acharColuna(cabecalho, ["nome", "name", "colaborador"]);
  const iCpf = acharColuna(cabecalho, ["cpf"]);
  const iFuncao = acharColuna(cabecalho, ["funcao", "cargo", "role"]);
  if (iNome < 0) {
    throw new Error('Cabeçalho inválido: inclua ao menos a coluna "Nome".');
  }
  return linhas.slice(1).map((linha, indice) => ({
    linha: indice + 2,
    nome: (linha[iNome] ?? "").trim(),
    cpf: iCpf >= 0 ? (linha[iCpf] ?? "").trim() : "",
    funcao: iFuncao >= 0 ? (linha[iFuncao] ?? "").trim() : "",
  }));
}

/**
 * Reaproveita as funções já cadastradas: se o texto da planilha casar (ignorando
 * acento/caixa) com uma função conhecida, devolve a versão canônica; senão, o texto original.
 */
export function casarFuncao(valor: string, conhecidas: readonly string[]) {
  const alvo = semAcento(valor);
  if (!alvo) return "";
  return conhecidas.find((f) => semAcento(f) === alvo) ?? valor.trim().slice(0, 80);
}
