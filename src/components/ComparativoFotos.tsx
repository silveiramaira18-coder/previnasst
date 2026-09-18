import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { listarFotos, urlAssinada, type Foto } from "@/lib/fotos";

function Miniatura({ foto, alt }: { foto: Foto; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    urlAssinada(foto.url)
      .then((u) => ativo && setSrc(u))
      .catch(() => ativo && setSrc(null));
    return () => {
      ativo = false;
    };
  }, [foto.url]);

  return (
    <div className="overflow-hidden rounded-xl border bg-muted">
      {src ? (
        <img src={src} alt={alt} className="aspect-square w-full object-cover" loading="lazy" />
      ) : (
        <div className="aspect-square w-full animate-pulse bg-muted" />
      )}
    </div>
  );
}

function Coluna({ titulo, fotos, vazio }: { titulo: string; fotos: Foto[]; vazio: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{titulo}</p>
      {fotos.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
          {vazio}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {fotos.map((f, i) => (
            <Miniatura key={f.id} foto={f} alt={`${titulo} ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Comparativo lado a lado: foto do problema x foto da solução. */
export function ComparativoFotos({
  ncId,
  itemId,
}: {
  ncId: string;
  itemId?: string | null | undefined;
}) {
  const { data: problema = [] } = useQuery({
    queryKey: ["comparativo-problema", ncId, itemId],
    queryFn: async () => {
      const originais = itemId
        ? await listarFotos("fotos_item_inspecao", "item_inspecao_id", itemId)
        : [];
      if (originais.length > 0) return originais;
      return listarFotos("fotos_nao_conformidade", "nao_conformidade_id", ncId, "problema");
    },
  });

  const { data: solucao = [] } = useQuery({
    queryKey: ["fotos", "fotos_nao_conformidade", ncId, "solucao"],
    queryFn: () => listarFotos("fotos_nao_conformidade", "nao_conformidade_id", ncId, "solucao"),
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Coluna titulo="Foto do problema" fotos={problema} vazio="Sem foto registrada na inspeção" />
      <Coluna
        titulo="Foto da solução / adequação"
        fotos={solucao}
        vazio="Ainda sem evidência de correção"
      />
    </div>
  );
}
