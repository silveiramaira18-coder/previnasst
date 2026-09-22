import { useMutation } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BadgeValidade } from "@/components/ged/BadgeValidade";
import { ConfirmacaoExclusao } from "@/components/ged/ConfirmacaoExclusao";
import { EditarDocumento } from "@/components/ged/EditarDocumento";
import { PreviewDocumento } from "@/components/ged/PreviewDocumento";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/db";
import {
  TIPOS_DOC_COLABORADOR,
  TIPOS_DOC_EMPRESA,
  agruparPorEmpresa,
  documentoNoFiltro,
  excluirDocumento,
  urlDocumento,
  type DocumentoAlerta,
  type FiltroPrazo,
} from "@/lib/ged";

function CardAlerta({
  doc,
  podeAlterar,
  onMudou,
}: {
  doc: DocumentoAlerta;
  podeAlterar: boolean;
  onMudou: () => void | Promise<void>;
}) {
  const tipos = doc.tabela === "company_documents" ? TIPOS_DOC_EMPRESA : TIPOS_DOC_COLABORADOR;

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
      await onMudou();
      toast.success("Documento excluído");
    },
    onError: (e: Error) => toast.error("Não foi possível excluir", { description: e.message }),
  });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
      <div className="min-w-[180px] flex-1 space-y-1">
        <p className="font-semibold">{doc.title}</p>
        <p className="text-xs text-muted-foreground">{doc.origem}</p>
        <p className="text-xs text-muted-foreground">
          {doc.expiration_date ? `Validade: ${formatarData(doc.expiration_date)}` : "Sem data de validade"}
        </p>
      </div>
      <BadgeValidade validade={doc.expiration_date} />
      <div className="ml-auto flex shrink-0 gap-1">
        <PreviewDocumento doc={doc} />
        {podeAlterar ? (
          <EditarDocumento doc={doc} tabela={doc.tabela} tipos={tipos} onSalvo={onMudou} />
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

export function PainelAlertas({
  documentos,
  filtro,
  podeAlterar,
  onMudou,
}: {
  documentos: DocumentoAlerta[];
  filtro: FiltroPrazo;
  podeAlterar: boolean;
  onMudou: () => void | Promise<void>;
}) {
  const grupos = agruparPorEmpresa(documentos.filter((d) => documentoNoFiltro(d, filtro)));

  if (grupos.length === 0)
    return (
      <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        Nenhum documento encontrado para este prazo.
      </p>
    );

  return (
    <div className="space-y-5">
      {grupos.map((grupo) => (
        <div key={grupo.empresa} className="space-y-2">
          <p className="text-sm font-semibold">
            {grupo.empresa}{" "}
            <span className="font-normal text-muted-foreground">({grupo.documentos.length})</span>
          </p>
          {grupo.documentos.map((doc) => (
            <CardAlerta key={`${doc.tabela}-${doc.id}`} doc={doc} podeAlterar={podeAlterar} onMudou={onMudou} />
          ))}
        </div>
      ))}
    </div>
  );
}
