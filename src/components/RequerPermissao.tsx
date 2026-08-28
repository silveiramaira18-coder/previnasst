import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { usePerfil, type Permissao } from "@/lib/perfil";

export function RequerPermissao({
  permissao,
  children,
}: {
  permissao: Permissao;
  children: ReactNode;
}) {
  const { pode, isLoading } = usePerfil();

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  if (!pode(permissao)) {
    return (
      <div className="mx-auto grid max-w-md place-items-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Acesso não autorizado</h1>
        <p className="text-sm text-muted-foreground">
          Seu tipo de usuário não tem permissão para acessar esta área.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Voltar ao dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
