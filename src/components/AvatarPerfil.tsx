import { useQuery } from "@tanstack/react-query";

import { urlAssinada } from "@/lib/fotos";
import { cn } from "@/lib/utils";

export function AvatarPerfil({
  caminho,
  nome,
  className,
}: {
  caminho: string | null | undefined;
  nome: string | null | undefined;
  className?: string;
}) {
  const { data: url } = useQuery({
    queryKey: ["avatar", caminho],
    queryFn: () => (caminho ? urlAssinada(caminho) : Promise.resolve(null)),
    enabled: !!caminho,
    staleTime: 30 * 60 * 1000,
  });

  const iniciais = (nome || "?").trim().slice(0, 2).toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={`Foto de perfil de ${nome || "usuário"}`}
        className={cn("size-10 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-muted font-display text-sm font-bold text-muted-foreground",
        className,
      )}
      aria-hidden="true"
    >
      {iniciais}
    </div>
  );
}
