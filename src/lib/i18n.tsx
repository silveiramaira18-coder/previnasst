import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Idioma = "pt-BR" | "es";

export const IDIOMAS: { valor: Idioma; rotulo: string }[] = [
  { valor: "pt-BR", rotulo: "Português (PT-BR)" },
  { valor: "es", rotulo: "Español (ES)" },
];

const CHAVE = "previna-sst:idioma";

/** Dicionário PT-BR → ES. A chave é o texto em português usado na interface. */
const ES: Record<string, string> = {
  // Navegação
  Dashboard: "Panel",
  Obras: "Obras",
  "Nova Inspeção": "Nueva Inspección",
  Inspeções: "Inspecciones",
  "Lista de Verificação": "Lista de Verificación",
  "Não Conformidades": "No Conformidades",
  "Ações Corretivas": "Acciones Correctivas",
  Relatórios: "Informes",
  "Meu Perfil": "Mi Perfil",
  Configurações: "Configuración",
  Navegação: "Navegación",
  "Inspeções de Segurança": "Inspecciones de Seguridad",
  Sair: "Salir",
  // Títulos de página
  "Inspeções Realizadas": "Inspecciones Realizadas",
  "Inspeção de Segurança do Trabalho": "Inspección de Seguridad Laboral",
  "Gestão de Obras": "Gestión de Obras",
  // Ações comuns
  Visualizar: "Ver",
  Editar: "Editar",
  Excluir: "Eliminar",
  Finalizar: "Finalizar",
  "Baixar PDF": "Descargar PDF",
  Cancelar: "Cancelar",
  Salvar: "Guardar",
  Idioma: "Idioma",
  "Selecione o idioma da interface": "Seleccione el idioma de la interfaz",
};

type Ctx = { idioma: Idioma; setIdioma: (i: Idioma) => void; t: (texto: string) => string };

const IdiomaContext = createContext<Ctx>({
  idioma: "pt-BR",
  setIdioma: () => {},
  t: (texto) => texto,
});

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdiomaState] = useState<Idioma>("pt-BR");

  useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo === "es" || salvo === "pt-BR") setIdiomaState(salvo);
  }, []);

  const setIdioma = useCallback((i: Idioma) => {
    setIdiomaState(i);
    window.localStorage.setItem(CHAVE, i);
  }, []);

  const t = useCallback((texto: string) => (idioma === "es" ? (ES[texto] ?? texto) : texto), [idioma]);

  return <IdiomaContext.Provider value={{ idioma, setIdioma, t }}>{children}</IdiomaContext.Provider>;
}

export function useIdioma() {
  return useContext(IdiomaContext);
}
