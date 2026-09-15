import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  carregarPavimentos,
  criarPavimento,
  excluirPavimento,
  renomearPavimento,
} from "@/lib/pavimentos";

/** Cadastro de pavimentos/setores de uma obra (lista padrão editável). */
export function GerenciarPavimentos({ obraId, obraNome }: { obraId: string; obraNome: string }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [novo, setNovo] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  const chave = ["pavimentos", obraId];
  const { data: pavimentos = [], isLoading } = useQuery({
    queryKey: chave,
    queryFn: () => carregarPavimentos(obraId),
    enabled: aberto,
  });

  const recarregar = () => qc.invalidateQueries({ queryKey: chave });

  const adicionar = useMutation({
    mutationFn: () => criarPavimento(obraId, novo.trim(), pavimentos.length),
    onSuccess: () => {
      setNovo("");
      recarregar();
    },
    onError: (e: Error) => toast.error("Não foi possível adicionar", { description: e.message }),
  });

  const renomear = useMutation({
    mutationFn: () => renomearPavimento(editandoId!, nomeEdicao.trim()),
    onSuccess: () => {
      setEditandoId(null);
      setNomeEdicao("");
      recarregar();
    },
    onError: (e: Error) => toast.error("Não foi possível renomear", { description: e.message }),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => excluirPavimento(id),
    onSuccess: recarregar,
    onError: (e: Error) => toast.error("Não foi possível excluir", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Layers className="size-3.5" /> Pavimentos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pavimentos / setores — {obraNome}</DialogTitle>
        </DialogHeader>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (novo.trim()) adicionar.mutate();
          }}
        >
          <Input
            className="h-12"
            placeholder="Ex.: Tipo 11"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
          />
          <Button type="submit" size="lg" className="h-12 gap-1" disabled={adicionar.isPending}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </form>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}

        <ul className="space-y-2">
          {pavimentos.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-lg border p-2">
              {editandoId === p.id ? (
                <>
                  <Input
                    className="h-10"
                    value={nomeEdicao}
                    onChange={(e) => setNomeEdicao(e.target.value)}
                  />
                  <Button size="sm" disabled={renomear.isPending} onClick={() => renomear.mutate()}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditandoId(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm">{p.nome}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      setEditandoId(p.id);
                      setNomeEdicao(p.nome);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    onClick={() => excluir.mutate(p.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
