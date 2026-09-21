import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FUNCOES_CONSTRUCAO,
  cpfValido,
  formatarCpf,
  listarFuncoesPersonalizadas,
  salvarColaborador,
} from "@/lib/ged";

type ResultadoLinha = {
  linha: number;
  nome: string;
  status: "importado" | "erro";
  motivo?: string;
};

/** Divide o conteúdo do CSV em linhas/colunas tolerando aspas e delimitadores ; , ou tab. */
function parseCsv(texto: string): string[][] {
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

const semAcento = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

/** Localiza a coluna cujo cabeçalho casa com qualquer um dos rótulos aceitos. */
function acharColuna(cabecalho: string[], candidatos: string[]) {
  const normalizado = cabecalho.map(semAcento);
  for (const c of candidatos) {
    const i = normalizado.indexOf(c);
    if (i >= 0) return i;
  }
  return -1;
}

const MODELO_CSV =
  "Nome;CPF;Funcao\n" +
  "Maria Oliveira;529.982.247-25;Engenheiro Civil\n" +
  "Joao Pereira;111.444.777-35;Pedreiro\n";

export function ImportarColaboradores({
  contractorId,
  onImportado,
}: {
  contractorId: string | null;
  onImportado: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultados, setResultados] = useState<ResultadoLinha[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: funcoesPersonalizadas = [] } = useQuery({
    queryKey: ["ged-funcoes", contractorId],
    queryFn: () => listarFuncoesPersonalizadas(contractorId),
    enabled: aberto,
  });

  /** Reaproveita as funções cadastradas: casa o texto da planilha com a lista existente. */
  const normalizarFuncao = (valor: string) => {
    const alvo = semAcento(valor);
    if (!alvo) return "";
    const conhecidas = [...FUNCOES_CONSTRUCAO, ...funcoesPersonalizadas.map((f) => f.name)];
    return conhecidas.find((f) => semAcento(f) === alvo) ?? valor.trim().slice(0, 80);
  };

  const importar = useMutation({
    mutationFn: async () => {
      if (!arquivo) throw new Error("Selecione um arquivo CSV.");
      const texto = await arquivo.text();
      const linhas = parseCsv(texto);
      if (linhas.length < 2) {
        throw new Error("A planilha precisa de um cabeçalho e ao menos uma linha de dados.");
      }
      const cabecalho = linhas[0]!;
      const iNome = acharColuna(cabecalho, ["nome", "name", "colaborador"]);
      const iCpf = acharColuna(cabecalho, ["cpf"]);
      const iFuncao = acharColuna(cabecalho, ["funcao", "função", "cargo", "role", "funçao"]);
      if (iNome < 0) {
        throw new Error('Cabeçalho inválido: inclua ao menos a coluna "Nome".');
      }

      const saida: ResultadoLinha[] = [];
      let importados = 0;
      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i]!;
        const numero = i + 1;
        const nome = (linha[iNome] ?? "").trim();
        const cpfBruto = iCpf >= 0 ? (linha[iCpf] ?? "").trim() : "";
        const funcaoBruta = iFuncao >= 0 ? (linha[iFuncao] ?? "").trim() : "";
        if (!nome) {
          saida.push({ linha: numero, nome: "(sem nome)", status: "erro", motivo: "Nome vazio." });
          continue;
        }
        const cpf = cpfBruto ? formatarCpf(cpfBruto) : "";
        if (cpf && !cpfValido(cpf)) {
          saida.push({ linha: numero, nome, status: "erro", motivo: "CPF inválido." });
          continue;
        }
        try {
          await salvarColaborador({
            contractor_id: contractorId,
            name: nome.slice(0, 120),
            cpf: cpf || null,
            role_title: normalizarFuncao(funcaoBruta) || null,
          });
          importados++;
          saida.push({ linha: numero, nome, status: "importado" });
        } catch (e) {
          saida.push({
            linha: numero,
            nome,
            status: "erro",
            motivo: e instanceof Error ? e.message : "Falha ao salvar.",
          });
        }
      }
      return { saida, importados };
    },
    onSuccess: ({ saida, importados }) => {
      setResultados(saida);
      const erros = saida.length - importados;
      if (importados > 0) {
        toast.success(`${importados} colaborador(es) importado(s)`, {
          description: erros ? `${erros} linha(s) ignorada(s). Veja os detalhes.` : undefined,
        });
        onImportado();
      } else {
        toast.error("Nenhum colaborador importado", {
          description: "Revise os motivos indicados em cada linha.",
        });
      }
    },
    onError: (e: Error) => toast.error("Não foi possível importar", { description: e.message }),
  });

  const baixarModelo = () => {
    const blob = new Blob([MODELO_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-colaboradores.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const limpar = () => {
    setArquivo(null);
    setResultados([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (!v) limpar();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-2">
          <FileSpreadsheet className="size-4" /> Importar planilha (CSV)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar colaboradores por planilha</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV com as colunas <strong>Nome</strong>, <strong>CPF</strong> e{" "}
            <strong>Função</strong>. O CPF é validado e conferido contra os cadastros já existentes
            desta empresa; a função reaproveita a lista já disponível no cadastro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={baixarModelo}
          >
            <Download className="size-4" /> Baixar modelo de planilha
          </Button>

          <div className="space-y-1.5">
            <Label htmlFor="csv-colaboradores">Arquivo CSV</Label>
            <Input
              id="csv-colaboradores"
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="h-12 pt-2.5"
              onChange={(e) => {
                setArquivo(e.target.files?.[0] ?? null);
                setResultados([]);
              }}
            />
          </div>

          {resultados.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">Resultado da importação</p>
              <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border p-2 text-sm">
                {resultados.map((r) => (
                  <li key={r.linha} className="flex items-start gap-2">
                    {r.status === "importado" ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <span className="min-w-0">
                      <span className="font-medium">
                        Linha {r.linha} — {r.nome}
                      </span>
                      {r.motivo ? (
                        <span className="block text-xs text-muted-foreground">{r.motivo}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {resultados.length > 0 ? (
            <Button type="button" variant="outline" className="h-12" onClick={limpar}>
              Limpar
            </Button>
          ) : null}
          <Button
            type="button"
            className="h-12 flex-1 gap-2"
            disabled={!arquivo || importar.isPending}
            onClick={() => importar.mutate()}
          >
            <Upload className="size-4" />
            {importar.isPending ? "Importando..." : "Importar colaboradores"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
