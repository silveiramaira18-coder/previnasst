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
import { casarFuncao, extrairLinhasColaboradores } from "@/lib/csv-colaboradores";
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

  const importar = useMutation({
    mutationFn: async () => {
      if (!arquivo) throw new Error("Selecione um arquivo CSV.");
      const linhas = extrairLinhasColaboradores(await arquivo.text());
      const conhecidas = [...FUNCOES_CONSTRUCAO, ...funcoesPersonalizadas.map((f) => f.name)];

      const saida: ResultadoLinha[] = [];
      let importados = 0;
      for (const { linha, nome, cpf: cpfBruto, funcao } of linhas) {
        if (!nome) {
          saida.push({ linha, nome: "(sem nome)", status: "erro", motivo: "Nome vazio." });
          continue;
        }
        const cpf = cpfBruto ? formatarCpf(cpfBruto) : "";
        if (cpf && !cpfValido(cpf)) {
          saida.push({ linha, nome, status: "erro", motivo: "CPF inválido." });
          continue;
        }
        try {
          await salvarColaborador({
            contractor_id: contractorId,
            name: nome.slice(0, 120),
            cpf: cpf || null,
            role_title: casarFuncao(funcao, conhecidas) || null,
          });
          importados++;
          saida.push({ linha, nome, status: "importado" });
        } catch (e) {
          saida.push({
            linha,
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
