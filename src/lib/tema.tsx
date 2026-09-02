import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Tema = "light" | "dark";

const CHAVE = "previna-sst:tema";

type Ctx = { tema: Tema; setTema: (t: Tema) => void; alternar: () => void };

const TemaContext = createContext<Ctx>({ tema: "light", setTema: () => {}, alternar: () => {} });

function aplicar(tema: Tema) {
  const raiz = document.documentElement;
  raiz.classList.toggle("dark", tema === "dark");
  raiz.style.colorScheme = tema;
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>("light");

  useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE);
    const inicial: Tema =
      salvo === "dark" || salvo === "light"
        ? salvo
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTemaState(inicial);
    aplicar(inicial);
  }, []);

  const setTema = useCallback((t: Tema) => {
    setTemaState(t);
    window.localStorage.setItem(CHAVE, t);
    aplicar(t);
  }, []);

  const alternar = useCallback(() => {
    setTemaState((atual) => {
      const proximo: Tema = atual === "dark" ? "light" : "dark";
      window.localStorage.setItem(CHAVE, proximo);
      aplicar(proximo);
      return proximo;
    });
  }, []);

  return <TemaContext.Provider value={{ tema, setTema, alternar }}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}
