import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  enviarFotos,
  excluirFoto,
  listarFotos,
  salvarDescricao,
  urlAssinada,
  type Foto,
  type FotoTabela,
} from "@/lib/fotos";

type Props = {
  tabela: FotoTabela;
  coluna: string;
  valor: string;
  titulo?: string;
};

function FotoCard({
  foto,
  index,
  onExcluir,
  onDescricao,
}: {
  foto: Foto;
  index: number;
  onExcluir: () => void;
  onDescricao: (v: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [descricao, setDescricao] = useState(foto.descricao ?? "");

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
    <div className="space-y-2 rounded-xl border p-3">
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {src ? (
          <img
            src={src}
            alt={descricao || `Evidência fotográfica ${index + 1}`}
            className="aspect-square w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid aspect-square w-full place-items-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute right-2 top-2 size-9 rounded-full"
          aria-label={`Excluir foto ${index + 1}`}
          onClick={onExcluir}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <Input
        className="h-11"
        placeholder="Descrição / legenda da foto"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        onBlur={() => {
          if ((foto.descricao ?? "") !== descricao) onDescricao(descricao);
        }}
      />
    </div>
  );
}

export function FotoManager({ tabela, coluna, valor, titulo = "Evidências Fotográficas" }: Props) {
  const qc = useQueryClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const chave = ["fotos", tabela, valor];

  const { data: fotos = [], isLoading } = useQuery({
    queryKey: chave,
    queryFn: () => listarFotos(tabela, coluna, valor),
  });

  const upload = useMutation({
    mutationFn: (arquivos: File[]) => enviarFotos(tabela, coluna, valor, arquivos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chave });
      toast.success("Fotos enviadas");
    },
    onError: (e: Error) => toast.error("Erro ao enviar fotos", { description: e.message }),
  });

  const remover = useMutation({
    mutationFn: (foto: Foto) => excluirFoto(tabela, foto.id, foto.url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chave });
      toast.success("Foto excluída");
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  const descrever = useMutation({
    mutationFn: ({ id, descricao }: { id: string; descricao: string }) =>
      salvarDescricao(tabela, id, descricao),
    onSuccess: () => qc.invalidateQueries({ queryKey: chave }),
    onError: (e: Error) => toast.error("Erro ao salvar descrição", { description: e.message }),
  });

  const adicionar = (files: FileList | null) => {
    if (!files?.length) return;
    upload.mutate(Array.from(files));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{titulo}</p>
        {upload.isPending ? (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Enviando...
          </span>
        ) : null}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          adicionar(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          adicionar(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          size="lg"
          className="h-14 gap-2 text-base"
          disabled={upload.isPending}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="size-5" /> Tirar foto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 gap-2 text-base"
          disabled={upload.isPending}
          onClick={() => galeriaRef.current?.click()}
        >
          <ImagePlus className="size-5" /> Galeria / Upload
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando fotos...</p>
      ) : fotos.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <Upload className="size-6" />
          <p className="text-sm">Nenhuma foto adicionada ainda</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((f, idx) => (
            <FotoCard
              key={f.id}
              foto={f}
              index={idx}
              onExcluir={() => remover.mutate(f)}
              onDescricao={(descricao) => descrever.mutate({ id: f.id, descricao })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
