import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importarColaboradores, lerCsvColaboradores, type ResultadoImportacao } from "@/lib/ged";

export function ImportarColaboradores({
  contractorId,
  onImportado,
}: {
  contractorId: string | null;
  onImportado: () => void | Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  const importar = useMutation({
    mutationFn: async () => {
      if (!arquivo) throw new Error("Selecione um arquivo CSV.");
      const linhas = lerCsvColaboradores(await arquivo.text());
      if (linhas.length === 0) throw new Error("A planilha está vazia.");
      if (linhas.length > 500) throw new Error("Importe no máximo 500 colaboradores por vez.");
      return importarColaboradores(contractorId, linhas);
    },
    onSuccess: async (res) => {
      setResultado(res);
      await onImportado();
      if (res.importados > 0)
        toast.success(`${res.importados} colaborador(es) importado(s)`);
      if (res.erros.length > 0)
        toast.warning(`${res.erros.length} linha(s) não foram importadas`);
    },
    onError: (e: Error) => toast.error("Não foi possível importar", { description: e.message }),
  });

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (!v) {
          setArquivo(null);
          setResultado(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-2">
          <Upload className="size-4" /> Importar planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar colaboradores por planilha</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            Use um arquivo CSV com três colunas nesta ordem: <strong>Nome, CPF, Função</strong>. A
            primeira linha pode ser o cabeçalho. CPFs inválidos ou já cadastrados nesta empresa são
            ignorados e listados ao final. Funções novas são salvas na lista para os próximos
            cadastros.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="csv-colaboradores">Arquivo CSV</Label>
            <Input
              id="csv-colaboradores"
              type="file"
              accept=".csv,text/csv"
              className="h-12 pt-2.5"
              onChange={(e) => {
                setArquivo(e.target.files?.[0] ?? null);
                setResultado(null);
              }}
            />
          </div>

          {resultado ? (
            <div className="space-y-2 rounded-xl border p-3 text-sm">
              <p className="font-semibold">{resultado.importados} colaborador(es) importado(s).</p>
              {resultado.erros.length > 0 ? (
                <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {resultado.erros.map((erro) => (
                    <li key={`${erro.linha}-${erro.nome}`}>
                      Linha {erro.linha} — {erro.nome}: {erro.motivo}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <Button
            type="button"
            className="h-12 w-full"
            disabled={!arquivo || importar.isPending}
            onClick={() => importar.mutate()}
          >
            {importar.isPending ? "Importando..." : "Importar colaboradores"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
