import { ImageIcon } from "lucide-react";
import { useState } from "react";

import { FotoManager } from "@/components/FotoManager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FotoTabela } from "@/lib/fotos";

export function FotoDialog({
  tabela,
  coluna,
  valor,
  titulo,
  rotulo = "Fotos",
}: {
  tabela: FotoTabela;
  coluna: string;
  valor: string;
  titulo: string;
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <ImageIcon className="size-4" /> {rotulo}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        {aberto ? (
          <FotoManager tabela={tabela} coluna={coluna} valor={valor} titulo="Evidências" />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
