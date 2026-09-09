import { useEffect, useState } from "react";

/** Chave usada para guardar rascunhos de inspeção no dispositivo. */
const PREFIXO = "previna-sst:rascunho:";

/** Indica se o dispositivo está conectado à internet. */
export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  return online;
}

/** Salva/recupera o rascunho de um formulário no armazenamento local do aparelho. */
export function salvarRascunho(chave: string, valor: unknown) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    /* armazenamento cheio ou indisponível */
  }
}

export function lerRascunho<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function limparRascunho(chave: string) {
  try {
    localStorage.removeItem(PREFIXO + chave);
  } catch {
    /* ignora */
  }
}

/** Registra o service worker que mantém o app aberto mesmo sem internet. */
export function registrarServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((erro) => {
      console.error("Falha ao registrar o modo offline", erro);
    });
  });
}
