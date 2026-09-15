import { Download, Share, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstalacaoApp } from "@/lib/pwa";

/**
 * Botão "Baixar App": usa o instalador nativo no Android/PC e mostra o
 * passo a passo no iPhone/iPad.
 */
export function BotaoInstalarApp({
  variante = "topo",
  onAcao,
}: {
  variante?: "topo" | "menu";
  onAcao?: () => void;
}) {
  const { podeMostrar, temPromptNativo, ios, instalar } = useInstalacaoApp();
  const [aberto, setAberto] = useState(false);

  if (!podeMostrar || (!temPromptNativo && !ios)) return null;

  const clicar = async () => {
    onAcao?.();
    if (temPromptNativo) {
      await instalar();
      return;
    }
    setAberto(true);
  };

  return (
    <>
      {variante === "menu" ? (
        <Button
          type="button"
          onClick={clicar}
          className="w-full justify-start gap-2"
          size="lg"
        >
          <Download className="size-5 shrink-0" />
          Baixar App
        </Button>
      ) : (
        <Button type="button" onClick={clicar} size="sm" className="gap-2">
          <Download className="size-4" />
          <span className="hidden sm:inline">Baixar App</span>
        </Button>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Instalar o Previna SST no iPhone</DialogTitle>
            <DialogDescription>
              Em poucos segundos o app fica com ícone próprio na tela de início.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-4">
            <li className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-semibold">Toque em Compartilhar</p>
                <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <Share className="size-5 text-primary" />
                  Ícone de quadrado com seta para cima, na barra do Safari.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-semibold">Adicionar à Tela de Início</p>
                <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <Plus className="size-5 text-primary" />
                  Role a lista, escolha essa opção e confirme em "Adicionar".
                </p>
              </div>
            </li>
          </ol>

          <Button onClick={() => setAberto(false)}>Entendi</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
