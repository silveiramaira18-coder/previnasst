import { useMutation } from "@tanstack/react-query";
import { Download, History, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BadgeValidade } from "@/components/ged/BadgeValidade";
import { ConfirmacaoExclusao } from "@/components/ged/ConfirmacaoExclusao";
import { EditarDocumento } from "@/components/ged/EditarDocumento";
import { PreviewDocumento } from "@/components/ged/PreviewDocumento";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/db";
import { baixarDocumentoComNome, excluirDocumento, type Documento } from "@/lib/ged";
import { usePerfil } from "@/lib/perfil";

type Tabela = "company_documents" | "employee_documents";

function Linha({
  doc,
  tabela,
  onMudou,
  obsoleto,
  podeAlterar,
  tipos,
  entidade,
}: {
  doc: Documento;
  tabela: Tabela;
  onMudou: () => void | Promise<void>;
  obsoleto?: boolean;
  podeAlterar: boolean;
  tipos: readonly string[];
  entidade?: string | null | undefined;
}) {
  const { perfil, adminPrincipal } = usePerfil();
  const permitido = podeAlterar && (adminPrincipal || (!!perfil?.id && perfil.id === doc.user_id));

  const baixar = useMutation({
    mutationFn: () => baixarDocumentoComNome(doc.file_url, doc.title, entidade),
    onError: (e: Error) => toast.error("Não foi possível baixar", { description: e.message }),
  });


  const remover = useMutation({
    mutationFn: () => excluirDocumento(tabela, doc.id, doc.file_url),
    onSuccess: () => {
      toast.success("Documento excluído");
      onMudou();
    },
    onError: (e: Error) => toast.error("Não foi possível excluir", { description: e.message }),
  });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
      <div className="min-w-[180px] flex-1 space-y-1">
        <p className="font-semibold">
          {doc.title}{" "}
          <span className="text-xs font-normal text-muted-foreground">v{doc.version}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {doc.doc_type}
          {doc.issue_date ? ` · Emissão ${formatarData(doc.issue_date)}` : ""}
          {doc.expiration_date ? ` · Validade ${formatarData(doc.expiration_date)}` : ""}
        </p>
      </div>
      {obsoleto ? (
        <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          Obsoleto
        </span>
      ) : (
        <BadgeValidade validade={doc.expiration_date} />
      )}
      <div className="ml-auto flex shrink-0 gap-1">
        <PreviewDocumento doc={doc} />
        {permitido ? <EditarDocumento doc={doc} tabela={tabela} tipos={tipos} onSalvo={onMudou} /> : null}
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
        {permitido ? (
          <ConfirmacaoExclusao
            nome={`“${doc.title}” (v${doc.version})`}
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

export function ListaDocumentos({
  documentos,
  tabela,
  onMudou,
  vazio = "Nenhum documento anexado ainda.",
  podeAlterar,
  tipos,
  entidade,
}: {
  documentos: Documento[];
  tabela: Tabela;
  onMudou: () => void | Promise<void>;
  vazio?: string;
  podeAlterar: boolean;
  tipos: readonly string[];
  entidade?: string | null | undefined;
}) {
  const ativos = documentos.filter((d) => d.status === "active");
  const obsoletos = documentos.filter((d) => d.status !== "active");

  return (
    <div className="space-y-3">
      {ativos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          {vazio}
        </p>
      ) : (
        ativos.map((d) => <Linha key={d.id} doc={d} tabela={tabela} onMudou={onMudou} podeAlterar={podeAlterar} tipos={tipos} entidade={entidade} />)
      )}

      {obsoletos.length > 0 ? (
        <Accordion type="single" collapsible>
          <AccordionItem value="historico" className="border-none">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <History className="size-4" /> Ver histórico / obsoletos ({obsoletos.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-2">
              {obsoletos.map((d) => (
                <Linha key={d.id} doc={d} tabela={tabela} onMudou={onMudou} obsoleto podeAlterar={podeAlterar} tipos={tipos} entidade={entidade} />
              ))}

            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}
