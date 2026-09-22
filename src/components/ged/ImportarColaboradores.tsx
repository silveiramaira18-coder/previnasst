import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePerfil } from "@/lib/perfil";
import {
  FUNCOES_CONSTRUCAO,
  MODELO_CSV_COLABORADORES,
  analisarPlanilhaColaboradores,
  importarColaboradoresValidos,
  listarColaboradores,
  listarFuncoesPersonalizadas,
  type LinhaPlanilhaColaborador,
} from "@/lib/ged";

function baixarModelo() {
  const arquivo = new Blob([MODELO_CSV_COLABORADORES], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo-colaboradores.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ImportarColaboradores({
  contractorId,
  onSalvo,
}: {
  contractorId: string | null;
  onSalvo: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [texto, setTexto] = useState("");
  const qc = useQueryClient();
  const { perfil } = usePerfil();

  const { data: existentes = [] } = useQuery({
    queryKey: ["ged-colaboradores", contractorId],
    queryFn: () => listarColaboradores(contractorId),
    enabled: aberto,
  });
  const { data: funcoes = [] } = useQuery({
    queryKey: ["ged-funcoes", contractorId],
    queryFn: () => listarFuncoesPersonalizadas(contractorId),
    enabled: aberto,
  });

  const analise = useMemo(() => {
    if (!texto.trim()) return null;
    const daEmpresa = existentes.filter(
      (colaborador) => !perfil?.id || colaborador.user_id === perfil.id,
    );
    return analisarPlanilhaColaboradores(texto, {
      funcoesConhecidas: [...FUNCOES_CONSTRUCAO, ...funcoes.map((funcao) => funcao.name)],
      existentes: daEmpresa,
    });
  }, [texto, existentes, funcoes, perfil?.id]);

  const validas = (analise?.linhas ?? []).filter(
    (linha): linha is Extract<LinhaPlanilhaColaborador, { status: "valida" }> =>
      linha.status === "valida",
  );

  const importar = useMutation({
    mutationFn: () => importarColaboradoresValidos(contractorId, validas),
    onSuccess: async (salvos) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["ged-colaboradores", contractorId] }),
        qc.invalidateQueries({ queryKey: ["ged-funcoes", contractorId] }),
      ]);
      toast.success(
        salvos === 1 ? "1 colaborador importado" : `${salvos} colaboradores importados`,
      );
      setTexto("");
      setNomeArquivo("");
      setAberto(false);
      onSalvo();
    },
    onError: (erro: Error) =>
      toast.error("Não foi possível concluir a importação", { description: erro.message }),
  });

  const lerArquivo = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setNomeArquivo(arquivo.name);
    setTexto(await arquivo.text());
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={(proximo) => {
        setAberto(proximo);
        if (!proximo) {
          setTexto("");
          setNomeArquivo("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-2">
          <FileSpreadsheet className="size-4" /> Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar colaboradores</DialogTitle>
          <DialogDescription>
            A planilha usa as colunas nome, cpf e funcao. O CPF passa pela mesma validação do
            cadastro, inclusive duplicidade nesta empresa. Funções da construção e funções já salvas
            são reaproveitadas; uma função nova entra na lista desta empresa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="csv-colaboradores">Arquivo CSV</Label>
            <Button type="button" variant="link" className="h-auto p-0" onClick={baixarModelo}>
              Baixar modelo
            </Button>
          </div>
          <Input
            id="csv-colaboradores"
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(evento) => void lerArquivo(evento.target.files?.[0])}
          />
          {nomeArquivo ? <p className="text-xs text-muted-foreground">{nomeArquivo}</p> : null}
          {analise?.erroArquivo ? (
            <p className="text-sm text-destructive" role="alert">
              {analise.erroArquivo}
            </p>
          ) : null}
          {analise && !analise.erroArquivo ? (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {analise.linhas.map((linha) => (
                <li key={linha.linha} className="rounded-lg border p-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">
                      Linha {linha.linha}
                      {linha.name ? `: ${linha.name}` : ""}
                    </span>
                    <span
                      className={linha.status === "valida" ? "text-success" : "text-destructive"}
                    >
                      {linha.status === "valida"
                        ? linha.funcaoNova
                          ? "Nova função"
                          : "Pronta"
                        : "Erro"}
                    </span>
                  </div>
                  {linha.status === "erro" ? (
                    <p className="mt-1 text-destructive" role="alert">
                      {linha.mensagem}
                    </p>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      {[linha.cpf ?? "Sem CPF", linha.role_title].join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            type="button"
            className="h-12 w-full"
            disabled={
              !analise || Boolean(analise.erroArquivo) || validas.length === 0 || importar.isPending
            }
            onClick={() => importar.mutate()}
          >
            {importar.isPending
              ? "Importando..."
              : `Importar ${validas.length} ${validas.length === 1 ? "colaborador" : "colaboradores"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
