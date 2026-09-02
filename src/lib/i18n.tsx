import { createContext, useCallback, useContext, type ReactNode } from "react";

/** O Previna SST é fixo em Português (pt-BR). */
export type Idioma = "pt-BR";

export const IDIOMAS: { valor: Idioma; rotulo: string }[] = [
  { valor: "pt-BR", rotulo: "Português (PT-BR)" },
];

type Ctx = { idioma: Idioma; setIdioma: (i: Idioma) => void; t: (texto: string) => string };

const IdiomaContext = createContext<Ctx>({
  idioma: "pt-BR",
  setIdioma: () => {},
  t: (texto) => texto,
});

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const t = useCallback((texto: string) => texto, []);

  return (
    <IdiomaContext.Provider value={{ idioma: "pt-BR", setIdioma: () => {}, t }}>
      {children}
    </IdiomaContext.Provider>
  );
}

export function useIdioma() {
  return useContext(IdiomaContext);
}
