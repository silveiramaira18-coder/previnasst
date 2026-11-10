export function pertenceAoEscopo(userId: string | null | undefined, companyId: string | null | undefined, origem: { userId?: string; companyId?: string }) {
  return !!userId && !!companyId && origem.userId === userId && origem.companyId === companyId;
}