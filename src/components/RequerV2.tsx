import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

/** Protege as telas novas (V2): só administradores enxergam esta fase. */
export function RequerV2({ children }: { children: ReactNode }) {
  const { liberado, isLoading } = useFeatureAccess();

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  if (!liberado) {
    return (
      <div className="mx-auto grid max-w-md place-items-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Área em fase de testes</h1>
        <p className="text-sm text-muted-foreground">
          Esta tela está disponível apenas para os administradores do sistema.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Voltar ao dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
