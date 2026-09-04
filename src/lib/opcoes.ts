/** Listas de apoio dos formulários de inspeção. */

export const OUTROS = "Outros (informar manualmente)";

/** Categorias da não conformidade — "Outros" em 1º lugar, demais em ordem alfabética. */
export const CATEGORIAS_NC: string[] = [
  OUTROS,
  "Documentação Técnica e Registros",
  "EPC (Equipamento de Proteção Coletiva)",
  "EPIs (Equipamento de Proteção Individual)",
  "Ergonômico",
  "Espaço Confinado (NR-33)",
  "Iluminação e Ventilação",
  "Instalações Elétricas (NR-10)",
  "Organização e Limpeza",
  "Primeiros Socorros e Kits de Emergência",
  "Proteção contra Incêndio",
  "Sinalização de Segurança",
  "Trabalho a Quente (Solda, Corte)",
  "Trabalho em Altura (NR-35)",
];

/** Riscos potenciais sugeridos — "Outros" ao final para digitação livre. */
export const RISCOS_POTENCIAIS: string[] = [
  "Atropelamento por veículos ou máquinas pesadas",
  "Batida contra objetos, estruturas ou ferramentas",
  "Choque elétrico e queimaduras graves",
  "Colapso ou tombamento de estruturas/andaimes",
  "Corte, perfuração ou laceração de membros",
  "Dermatite de contato por manuseio de cimento/químicos sem proteção",
  "Lesão muscular e lombalgia por esforço excessivo ou postura inadequada",
  "Perda auditiva induzida por ruído (PAIR)",
  "Prensamento ou esmagamento por equipamentos",
  "Princípio de incêndio ou explosão",
  "Problemas respiratórios por inalação de poeiras (ex.: sílica, cimento)",
  "Projeção de partículas nos olhos (corpo estranho/lesão ocular)",
  "Queda de objetos, materiais ou ferramentas sobre trabalhadores",
  "Queda em altura com lesão grave ou fatal",
  "Queimadura por contato com produtos químicos ou superfícies quentes",
  "Soterramento ou desmoronamento em escavações",
  "Torção, entorse ou fratura por tropeço/escorregão",
  "Vazamento ou contaminação do solo por produtos químicos/combustíveis",
  OUTROS,
];

/** Cargos sugeridos para os responsáveis por resolver a não conformidade. */
export const CARGOS_RESPONSAVEIS: string[] = [
  "TST",
  "Engenheiro Residente",
  "Mestre de Obras",
  "Contramestre",
  "Encarregado",
  "Empresa Empreiteira",
];

/** "João (Engenheiro Residente), Pedro (Mestre de Obras)" */
export const formatarResponsaveis = (
  responsaveis: string[] | null | undefined,
  fallback?: string | null,
) => {
  const lista = (responsaveis ?? []).filter(Boolean);
  if (lista.length > 0) return lista.join(", ");
  return fallback || "—";
};
