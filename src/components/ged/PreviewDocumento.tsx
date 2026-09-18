import { Download, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BadgeValidade } from "@/components/ged/BadgeValidade";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatarData } from "@/lib/db";
import { urlDocumento, type Documento } from "@/lib/ged";

export function PreviewDocumento({ doc }: { doc: Documento }) {
  const [aberto, setAberto] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!aberto || !doc.file_url) return;
    let ativo = true;
    setUrl("");
    urlDocumento(doc.file_url)
      .then((assinada) => ativo && setUrl(assinada))
      .catch((e: Error) => toast.error("Não foi possível visualizar", { description: e.message }));
    return () => { ativo = false; };
  }, [aberto, doc.file_url]);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button type="button" size="icon" variant="ghost" aria-label="Visualizar PDF" disabled={!doc.file_url}>
          <Eye className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[94vh] w-[96vw] max-w-6xl flex-col gap-3 p-4 sm:p-5">
        <DialogHeader className="pr-8">
          <DialogTitle className="line-clamp-2">{doc.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2 border-b pb-3 text-sm text-muted-foreground">
          <span>{doc.expiration_date ? `Validade: ${formatarData(doc.expiration_date)}` : "Sem data de validade"}</span>
          <BadgeValidade validade={doc.expiration_date} />
          <div className="ml-auto flex gap-2">
            <Button asChild size="sm" variant="outline" disabled={!url}>
              <a href={url || undefined} download target="_blank" rel="noreferrer">
                <Download className="mr-2 size-4" /> Baixar PDF
              </a>
            </Button>
            <DialogClose asChild><Button type="button" size="sm">Fechar</Button></DialogClose>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted">
          {url ? (
            <iframe title={`Visualização de ${doc.title}`} src={url} className="h-full w-full bg-background" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Carregando documento...</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}