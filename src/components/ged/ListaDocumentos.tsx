import { useMutation } from "@tanstack/react-query";
import { Download, History, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BadgeValidade } from "@/components/ged/BadgeValidade";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/db";
import { excluirDocumento, urlDocumento, type Documento } from "@/lib/ged";

type Tabela = "company_documents" | "employee_documents";

function Linha({
  doc,
  tabela,
  onMudou,
  obsoleto,
}: {
  doc: Documento;
  tabela: Tabela;
  onMudou: () => void;
  obsoleto?: boolean;
}) {
  const baixar = useMutation({
    mutationFn: async () => {
      if (!doc.file_url) throw new Error("Este registro não possui arquivo anexado.");
      const url = await urlDocumento(doc.file_url);
      window.open(url, "_blank", "noopener");
    },
    onError: (e: Error) => toast.error("Não foi possível abrir", { description: e.message }),
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
      <div className="flex gap-1">
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
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Excluir documento"
          disabled={remover.isPending}
          onClick={() => {
            if (confirm(`Excluir "${doc.title}" (v${doc.version})?`)) remover.mutate();
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function ListaDocumentos({
  documentos,
  tabela,
  onMudou,
  vazio = "Nenhum documento anexado ainda.",
}: {
  documentos: Documento[];
  tabela: Tabela;
  onMudou: () => void;
  vazio?: string;
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
        ativos.map((d) => <Linha key={d.id} doc={d} tabela={tabela} onMudou={onMudou} />)
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
                <Linha key={d.id} doc={d} tabela={tabela} onMudou={onMudou} obsoleto />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}
