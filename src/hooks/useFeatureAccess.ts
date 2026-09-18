import { usePerfil } from "@/lib/perfil";

/**
 * Acesso às funcionalidades V2 (fluxo novo de inspeção, painel de plano de
 * ação e dashboard de tendências). Nesta fase, liberado exclusivamente para os
 * administradores do sistema. Os demais usuários continuam na interface atual.
 */
export function useFeatureAccess() {
  const { adminPrincipal, isLoading } = usePerfil();
  return { liberado: adminPrincipal, v2: adminPrincipal, isLoading };
}
