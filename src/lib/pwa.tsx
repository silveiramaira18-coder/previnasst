import { useEffect, useState } from "react";

/** Evento nativo de instalação (Android / Chrome / Edge no PC). */
type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const HOSTS_PREVIEW = [
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
];

/** Contextos onde o modo offline não pode ser ligado (pré-visualização/desenvolvimento). */
function contextoBloqueado() {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (HOSTS_PREVIEW.some((h) => host === h || host.endsWith(`.${h}`))) return true;
  if (new URLSearchParams(window.location.search).has("sw=off")) return true;
  return new URL(window.location.href).searchParams.get("sw") === "off";
}

async function removerRegistros() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs.filter((r) => (r.active?.scriptURL ?? "").endsWith("/sw.js")).map((r) => r.unregister()),
  );
}

/** Liga o funcionamento offline apenas no app publicado. */
export function registrarServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (contextoBloqueado()) {
    void removerRegistros();
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline indisponível neste navegador */
    });
  });
}

/** Detecta se o app já está aberto como aplicativo instalado. */
export function appInstalado() {
  if (typeof window === "undefined") return true;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return Boolean(standalone || iosStandalone);
}

export function ehIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ipad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || ipad;
}

/** Estado do botão "Baixar App". */
export function useInstalacaoApp() {
  const [prompt, setPrompt] = useState<EventoInstalacao | null>(null);
  const [instalado, setInstalado] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    registrarServiceWorker();
    setInstalado(appInstalado());
    setIos(ehIOS());

    const aoReceber = (e: Event) => {
      e.preventDefault();
      setPrompt(e as EventoInstalacao);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", aoReceber);
    window.addEventListener("appinstalled", aoInstalar);

    const mq = window.matchMedia?.("(display-mode: standalone)");
    const aoMudar = () => setInstalado(appInstalado());
    mq?.addEventListener?.("change", aoMudar);

    return () => {
      window.removeEventListener("beforeinstallprompt", aoReceber);
      window.removeEventListener("appinstalled", aoInstalar);
      mq?.removeEventListener?.("change", aoMudar);
    };
  }, []);

  const instalar = async () => {
    if (!prompt) return false;
    await prompt.prompt();
    const escolha = await prompt.userChoice;
    if (escolha.outcome === "accepted") setInstalado(true);
    setPrompt(null);
    return escolha.outcome === "accepted";
  };

  return {
    /** Mostra o botão quando o app ainda não está instalado. */
    podeMostrar: !instalado,
    temPromptNativo: Boolean(prompt),
    ios,
    instalar,
  };
}
