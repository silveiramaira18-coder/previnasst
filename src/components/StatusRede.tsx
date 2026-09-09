import { Cloud, CloudOff } from "lucide-react";

import { useOnline } from "@/lib/offline";

/** Indicador discreto de conexão exibido no topo do app. */
export function StatusRede() {
  const online = useOnline();

  return (
    <span
      className={
        online
          ? "hidden items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success sm:inline-flex"
          : "inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning-foreground"
      }
      title={
        online
          ? "Conectado — dados salvos no servidor"
          : "Sem conexão — o app continua funcionando e os dados preenchidos ficam salvos no aparelho"
      }
    >
      {online ? <Cloud className="size-3.5" /> : <CloudOff className="size-3.5" />}
      {online ? "Conectado" : "Modo offline"}
    </span>
  );
}
