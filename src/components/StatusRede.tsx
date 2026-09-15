import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { useOnline } from "@/lib/offline";
import { aoMudarFila, contarPendentes, iniciarSincronizacaoAutomatica, sincronizarFila } from "@/lib/sync";

/** Indicador de conexão + fila de envio das fotos feitas offline. */
export function StatusRede() {
  const online = useOnline();
  const [pendentes, setPendentes] = useState(0);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;
    const atualizar = () => {
      void contarPendentes().then((n) => {
        if (ativo) setPendentes(n);
      });
    };
    atualizar();
    const parar = aoMudarFila(atualizar);
    iniciarSincronizacaoAutomatica();
    return () => {
      ativo = false;
      parar();
    };
  }, []);

  const sincronizar = async () => {
    setEnviando(true);
    try {
      await sincronizarFila();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={
          online
            ? "hidden items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success sm:inline-flex"
            : "inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning-foreground"
        }
        title={
          online
            ? "Conectado — dados salvos no servidor"
            : "Sem conexão — o app continua funcionando e as fotos ficam salvas no aparelho"
        }
      >
        {online ? <Cloud className="size-3.5" /> : <CloudOff className="size-3.5" />}
        {online ? "Conectado" : "Modo offline"}
      </span>

      {pendentes > 0 && (
        <button
          type="button"
          onClick={sincronizar}
          disabled={!online || enviando}
          className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning-foreground disabled:opacity-70"
          title="Fotos guardadas no aparelho aguardando envio"
        >
          <RefreshCw className={enviando ? "size-3.5 animate-spin" : "size-3.5"} />
          {enviando ? "Enviando…" : `${pendentes} foto(s) para enviar`}
        </button>
      )}
    </div>
  );
}
