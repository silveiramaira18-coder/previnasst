import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { obras, tiposInspecao } from "@/lib/mock-data";

export const Route = createFileRoute("/nova-inspecao")({
  head: () => ({
    meta: [
      { title: "Nova Inspeção — SafeCheck" },
      {
        name: "description",
        content:
          "Registre uma inspeção de segurança do trabalho direto do celular, com evidências fotográficas e legendas.",
      },
      { property: "og:title", content: "Nova Inspeção — SafeCheck" },
      {
        property: "og:description",
        content: "Formulário rápido de inspeção em campo com fotos da câmera, galeria ou upload.",
      },
    ],
  }),
  component: NovaInspecao,
});

type Foto = { id: string; url: string; nome: string; legenda: string };

function NovaInspecao() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);

  // Armazenamento temporário: as imagens vivem apenas na memória do navegador.
  useEffect(() => {
    return () => fotos.forEach((f) => URL.revokeObjectURL(f.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adicionar = (files: FileList | null) => {
    if (!files?.length) return;
    const novas = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file),
      nome: file.name,
      legenda: "",
    }));
    setFotos((prev) => [...prev, ...novas]);
  };

  const remover = (id: string) =>
    setFotos((prev) => {
      const alvo = prev.find((f) => f.id === id);
      if (alvo) URL.revokeObjectURL(alvo.url);
      return prev.filter((f) => f.id !== id);
    });

  const setLegenda = (id: string, legenda: string) =>
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, legenda } : f)));

  const finalizar = () => {
    toast.info("Inspeção não enviada", {
      description:
        "O armazenamento de inspeções ainda não foi implementado. As fotos ficam apenas nesta sessão.",
    });
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <PageHeader
        title="Nova Inspeção"
        description="Preencha os dados e registre as evidências direto do celular."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da inspeção</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="obra">Obra</Label>
            <Select>
              <SelectTrigger id="obra" className="h-12 w-full">
                <SelectValue placeholder="Selecione a obra" />
              </SelectTrigger>
              <SelectContent>
                {obras.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" className="h-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hora">Horário</Label>
            <Input id="hora" type="time" className="h-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inspetor">Inspetor / responsável</Label>
            <Input id="inspetor" className="h-12" placeholder="Nome do profissional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="local">Setor ou local</Label>
            <Input id="local" className="h-12" placeholder="Ex.: Torre B — 7º pavimento" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="tipo">Tipo de inspeção</Label>
            <Select>
              <SelectTrigger id="tipo" className="h-12 w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposInspecao.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="obs">Observações gerais</Label>
            <Textarea
              id="obs"
              rows={5}
              placeholder="Descreva o que foi observado durante a inspeção..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evidências Fotográficas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="size-5" /> Tirar foto
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-14 gap-2 text-base"
              onClick={() => galeriaRef.current?.click()}
            >
              <ImagePlus className="size-5" /> Galeria / Upload
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            No celular, "Tirar foto" abre a câmera. No computador, use "Galeria / Upload" para
            selecionar imagens. As fotos ficam apenas nesta sessão (armazenamento temporário).
          </p>

          {fotos.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              <Upload className="size-6" />
              <p className="text-sm">Nenhuma foto adicionada ainda</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fotos.map((f, idx) => (
                <div key={f.id} className="space-y-2 rounded-xl border p-3">
                  <div className="relative overflow-hidden rounded-lg bg-muted">
                    <img
                      src={f.url}
                      alt={f.legenda || `Evidência fotográfica ${idx + 1} da inspeção`}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 size-9 rounded-full"
                      aria-label={`Excluir foto ${idx + 1}`}
                      onClick={() => remover(f.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Input
                    className="h-11"
                    placeholder="Descrição / legenda da foto"
                    value={f.legenda}
                    onChange={(e) => setLegenda(f.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {fotos.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {fotos.length} foto(s) associada(s) a esta inspeção.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background p-4 lg:static lg:border-0 lg:bg-transparent lg:p-0">
        <Button type="button" size="lg" className="h-14 w-full text-base" onClick={finalizar}>
          Finalizar Inspeção
        </Button>
      </div>
    </div>
  );
}