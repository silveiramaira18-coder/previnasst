import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FotoManager } from "@/components/FotoManager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { listarFotos } from "@/lib/fotos";

type Props = { ncId: string; numero: string; concluida: boolean };

export function ResolverNC({ ncId, numero, concluida }: Props) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [observacao, setObservacao] = useState("");

  const { data: fotos = [] } = useQuery({
    queryKey: ["fotos", "fotos_nao_conformidade", ncId],
    queryFn: () => listarFotos("fotos_nao_conformidade", "nao_conformidade_id", ncId),
    enabled: aberto,
  });

  const resolver = useMutation({
    mutationFn: async () => {
      if (fotos.length === 0) throw new Error("Anexe pelo menos 1 foto de evidência da correção.");
      const { error } = await supabase
        .from("nao_conformidades")
        .update({
          status: "Concluída",
          data_conclusao: new Date().toISOString().slice(0, 10),
          observacao: observacao || null,
        })
        .eq("id", ncId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ncs-todas"] });
      qc.invalidateQueries({ queryKey: ["indicadores"] });
      qc.invalidateQueries({ queryKey: ["resumo-usuarios"] });
      setAberto(false);
      toast.success(`NC ${numero} resolvida`);
    },
    onError: (e: Error) => toast.error("Não foi possível resolver", { description: e.message }),
  });

  if (concluida) return null;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <CheckCircle2 className="size-4" /> Resolver NC
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resolver NC {numero}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FotoManager
            tabela="fotos_nao_conformidade"
            coluna="nao_conformidade_id"
            valor={ncId}
            titulo="Evidência da correção (obrigatória)"
          />
          <div className="space-y-1.5">
            <Label htmlFor={`obs-${ncId}`}>Observação da tratativa</Label>
            <Textarea
              id={`obs-${ncId}`}
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva o que foi corrigido"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            size="lg"
            className="h-12 w-full"
            disabled={resolver.isPending}
            onClick={() => resolver.mutate()}
          >
            Confirmar resolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
