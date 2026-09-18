import { useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function ConfirmacaoExclusao({
  nome,
  onConfirmar,
  disabled,
  children,
}: {
  nome: string;
  onConfirmar: () => Promise<void> | void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [processando, setProcessando] = useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={disabled}>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir {nome}? Esta ação não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={processando}
              onClick={async (evento) => {
                evento.preventDefault();
                setProcessando(true);
                try {
                  await onConfirmar();
                } finally {
                  setProcessando(false);
                }
              }}
            >
              {processando ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}