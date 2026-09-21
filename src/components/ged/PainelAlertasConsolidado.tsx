import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Download, Trash2, Truck, User } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { BadgeValidade } from "@/components/ged/BadgeValidade";
import { ConfirmacaoExclusao } from "@/components/ged/ConfirmacaoExclusao";
import { EditarDocumento } from "@/components/ged/EditarDocumento";
import { PreviewDocumento } from "@/components/ged/PreviewDocumento";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarData } from "@/lib/db";
import {
  agruparAlertas,
  excluirDocumento,
  urlDocumento,
  type DocumentoAlerta,
  type FiltroPrazo,
} from "@/lib/ged";

const ROTULO_FILTRO: Record<FiltroPrazo, string> = {
  todos: "Todos os documentos",
  vencidos: "Documentos vencidos",
  "7": "Vencem em até 7 dias",
  "15": "Vencem em até 15 dias",
  "30": "Vencem em até 30 dias",
};

function CardDocumento({
  doc,
  podeAlterar,
  onMudou,
}: {
  doc: DocumentoAlerta;
  podeAlterar: boolean;
  onMudou: () => void | Promise<void>;
}) {
  const baixar = useMutation({
    mutationFn: async () => {
      if (!doc.file_url) throw new Error("Este registro não possui arquivo anexado.");
      window.open(await urlDocumento(doc.file_url), "_blank", "noopener");
    },
    onError: (e: Error) => toast.error("Não foi possível abrir", { description: e.message }),
  });

  const remover = useMutation({
    mutationFn: () => excluirDocumento(doc.tabela, doc.id, doc.file_url),
    onSuccess: async () => {
      toast.success("Documento excluído");
      await onMudou();
    },
    onError: (e: Error) => toast.error("Não foi possível excluir", { description: e.message }),
  });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
      <div className="min-w-[180px] flex-1 space-y-1">
        <p className="font-semibold">{doc.title}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {doc.origem === "empresa" ? (
            <>
              <Building2 className="size-3.5" /> Documento da Empresa
            </>
          ) : (
            <>
              <User className="size-3.5" /> Documento do Colaborador: {doc.colaboradorNome}
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {doc.doc_type}
          {doc.expiration_date
            ? ` · Validade ${formatarData(doc.expiration_date)}`
            : " · Sem validade"}
        </p>
      </div>
      <BadgeValidade validade={doc.expiration_date} />
      <div className="ml-auto flex shrink-0 gap-1">
        <PreviewDocumento doc={doc} />
        {podeAlterar ? (
          <EditarDocumento doc={doc} tabela={doc.tabela} tipos={doc.tipos} onSalvo={onMudou} />
        ) : null}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Baixar documento"
          disabled={!doc.file_url || baixar.isPending}
          onClick={() => baixar.mutate()}
        >
          <Download className="size-4" />
        </Button>
        {podeAlterar ? (
          <ConfirmacaoExclusao
            nome={`“${doc.title}”`}
            disabled={remover.isPending}
            onConfirmar={() => remover.mutateAsync()}
          >
            <Button type="button" size="icon" variant="ghost" aria-label="Excluir documento">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </ConfirmacaoExclusao>
        ) : null}
      </div>
    </div>
  );
}

export function PainelAlertasConsolidado({
  docs,
  filtroPrazo,
  busca,
  podeAlterar,
  nomeEmpresaPropria = "Empresa Própria",
}: {
  docs: DocumentoAlerta[];
  filtroPrazo: FiltroPrazo;
  busca: string;
  podeAlterar: boolean;
  nomeEmpresaPropria?: string;
}) {
  const qc = useQueryClient();
  const invalidar = () =>
    qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0] ?? "").startsWith("ged") });

  const grupos = useMemo(
    () => agruparAlertas(docs, filtroPrazo, busca),
    [docs, filtroPrazo, busca],
  );

  const total = grupos.reduce((soma, g) => soma + g.docs.length, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">
          Painel geral de alertas — {ROTULO_FILTRO[filtroPrazo]}
        </CardTitle>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {total} {total === 1 ? "documento" : "documentos"}
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        {total === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum documento encontrado para este filtro.
          </p>
        ) : (
          grupos.map((grupo) => {
            const titulo = grupo.tipo === "propria" ? nomeEmpresaPropria : grupo.titulo;
            return (
              <div key={grupo.chave} className="space-y-2">
                <div className="flex items-center gap-2">
                  {grupo.tipo === "propria" ? (
                    <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Truck className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <h3 className="max-w-[16rem] truncate text-sm font-semibold" title={titulo}>
                    {titulo}
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {grupo.docs.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {grupo.docs.map((doc) => (
                    <CardDocumento
                      key={`${doc.tabela}-${doc.id}`}
                      doc={doc}
                      podeAlterar={podeAlterar}
                      onMudou={invalidar}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
