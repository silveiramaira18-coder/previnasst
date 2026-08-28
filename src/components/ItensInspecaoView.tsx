import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { iconeResposta } from "@/components/ItensInspecao";
import { listarFotos, urlAssinada, type Foto } from "@/lib/fotos";
import { listarItens, type ItemInspecao } from "@/lib/itens";

function Miniatura({ foto, onAbrir }: { foto: Foto; onAbrir: (src: string) => void }) {
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

  if (!src) return <div className="size-24 animate-pulse rounded-lg bg-muted" />;

  return (
    <button type="button" onClick={() => onAbrir(src)} className="shrink-0">
      <img
        src={src}
        alt={foto.descricao || "Evidência fotográfica do item de inspeção"}
        className="size-24 rounded-lg object-cover"
        loading="lazy"
      />
    </button>
  );
}

function ItemView({ item }: { item: ItemInspecao }) {
  const [ampliada, setAmpliada] = useState<string | null>(null);
  const { data: fotos = [] } = useQuery({
    queryKey: ["fotos", "fotos_item_inspecao", item.id],
    queryFn: () => listarFotos("fotos_item_inspecao", "item_inspecao_id", item.id),
  });

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="font-semibold">
          Item {String(item.numero).padStart(2, "0")}
          {item.categoria ? ` — ${item.categoria}` : ""}
        </p>
        {item.pergunta ? <p className="text-sm">{item.pergunta}</p> : null}
        <p className="inline-flex items-center gap-1 text-sm font-medium">
          {iconeResposta(item.resposta)} {item.resposta || "Sem resposta"}
        </p>
        {item.observacao ? (
          <p className="text-sm text-muted-foreground">{item.observacao}</p>
        ) : null}
        {fotos.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {fotos.map((f) => (
              <Miniatura key={f.id} foto={f} onAbrir={setAmpliada} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sem evidências fotográficas.</p>
        )}

        <Dialog open={!!ampliada} onOpenChange={(o) => !o && setAmpliada(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-base">
                Evidência — Item {String(item.numero).padStart(2, "0")}
              </DialogTitle>
            </DialogHeader>
            {ampliada ? (
              <img
                src={ampliada}
                alt="Evidência fotográfica ampliada"
                className="max-h-[75vh] w-full rounded-lg object-contain"
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export function ItensInspecaoView({ inspecaoId }: { inspecaoId: string }) {
  const { data: itens = [] } = useQuery({
    queryKey: ["itens", inspecaoId],
    queryFn: () => listarItens(inspecaoId),
  });

  if (itens.length === 0)
    return <p className="text-sm text-muted-foreground">Nenhum item registrado nesta inspeção.</p>;

  return (
    <div className="space-y-3">
      {itens.map((item) => (
        <ItemView key={item.id} item={item} />
      ))}
    </div>
  );
}
