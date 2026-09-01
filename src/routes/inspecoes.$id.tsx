import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Download, Pencil, Trash2 } from "lucide-react";

import { useState } from "react";
import { toast } from "sonner";

import { ItensInspecao } from "@/components/ItensInspecao";
import { ItensInspecaoView } from "@/components/ItensInspecaoView";
import { ResumoInspecao } from "@/components/ResumoInspecao";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarHora, obterInspecao } from "@/lib/db";
import { gerarPdfInspecao } from "@/lib/pdf";

type BuscaInspecao = { editar?: boolean };

export const Route = createFileRoute("/inspecoes/$id")({
  validateSearch: (search: Record<string, unknown>): BuscaInspecao =>
    search["editar"] === true || search["editar"] === "true" ? { editar: true } : {},

  head: () => ({
    meta: [
      { title: "Detalhe da Inspeção — Previna SST" },
      {
        name: "description",
        content:
          "Detalhes da inspeção de segurança do trabalho com evidências fotográficas, não conformidades e ações corretivas.",
      },
      { property: "og:title", content: "Detalhe da Inspeção — Previna SST" },
      {
        property: "og:description",
        content: "Veja fotos, não conformidades e ações corretivas de uma inspeção.",
      },
    ],
  }),
  component: DetalheInspecao,
});


function DetalheInspecao() {
  const { id } = Route.useParams();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editando, setEditando] = useState(Boolean(busca.editar));
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const { data: inspecao, isLoading } = useQuery({
    queryKey: ["inspecao", id],
    queryFn: () => obterInspecao(id),
  });


  const finalizar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("inspecoes")
        .update({ status: "Concluída" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspecao", id] });
      qc.invalidateQueries({ queryKey: ["inspecoes-lista"] });
      toast.success("Inspeção finalizada");
    },
    onError: (e: Error) => toast.error("Erro ao finalizar", { description: e.message }),
  });

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inspecoes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspecoes-lista"] });
      toast.success("Inspeção excluída");
      navigate({ to: "/inspecoes" });
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  const baixarPdf = async () => {
    setGerandoPdf(true);
    try {
      await gerarPdfInspecao(id);
      toast.success("Relatório gerado");
    } catch (e) {
      toast.error("Erro ao gerar PDF", { description: (e as Error).message });
    } finally {
      setGerandoPdf(false);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando inspeção...</p>;
  if (!inspecao) return <p className="text-sm text-muted-foreground">Inspeção não encontrada.</p>;

  const dados = [
    ["Obra", inspecao.obras?.nome ?? "—"],
    ["Data", formatarData(inspecao.data)],
    ["Horário", formatarHora(inspecao.horario)],
    ["Responsável", inspecao.responsavel ?? "—"],
    ["Local / setor", inspecao.local ?? "—"],
    ["Tipo", inspecao.tipo_inspecao ?? "—"],
  ] as const;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
        <Link to="/inspecoes">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </Button>

      <PageHeader
        title={`Inspeção ${inspecao.numero}`}
        description={inspecao.obras?.nome ?? "Sem obra vinculada"}
        action={<StatusBadge value={inspecao.status} />}
      />

      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
        <Button variant="outline" size="lg" className="h-12 gap-2" onClick={() => setEditando(true)}>
          <Pencil className="size-4" /> Editar
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 gap-2"
          disabled={finalizar.isPending || inspecao.status === "Concluída"}
          onClick={() => finalizar.mutate()}
        >
          <CheckCircle2 className="size-4" /> Finalizar
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 gap-2"
          disabled={gerandoPdf}
          onClick={baixarPdf}
        >
          <Download className="size-4" /> Baixar PDF
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="h-12 gap-2"
          onClick={() => setConfirmarExclusao(true)}
        >
          <Trash2 className="size-4" /> Excluir
        </Button>
      </div>

      <Dialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deseja realmente excluir esta inspeção?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A inspeção {inspecao.numero} e todos os itens, fotos e não conformidades vinculados
            serão removidos definitivamente.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmarExclusao(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={excluir.isPending}
              onClick={() => excluir.mutate()}
            >
              Excluir inspeção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da inspeção</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dados.map(([label, valor]) => (
            <div key={label}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-0.5 font-medium">{valor}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações gerais</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          {inspecao.observacoes || "Sem observações registradas."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo da inspeção</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumoInspecao inspecaoId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Itens da inspeção</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditando((v) => !v)}>
            {editando ? "Ver resultado" : "Editar itens"}
          </Button>
        </CardHeader>
        <CardContent>
          {editando ? (
            <ItensInspecao inspecaoId={id} obraId={inspecao.obra_id} />
          ) : (
            <ItensInspecaoView inspecaoId={id} />
          )}
        </CardContent>
      </Card>

    </div>
  );
}
