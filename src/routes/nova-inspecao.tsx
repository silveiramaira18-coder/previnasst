import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { FotoManager } from "@/components/FotoManager";
import { ItensInspecao } from "@/components/ItensInspecao";
import { ResumoInspecao } from "@/components/ResumoInspecao";
import { RequerPermissao } from "@/components/RequerPermissao";
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
import { supabase } from "@/integrations/supabase/client";
import { listarObras } from "@/lib/db";
import { tiposInspecao } from "@/lib/mock-data";

export const Route = createFileRoute("/nova-inspecao")({
  head: () => ({
    meta: [
      { title: "Nova Inspeção — Previna SST" },
      {
        name: "description",
        content:
          "Registre uma inspeção de segurança do trabalho direto do celular, com evidências fotográficas e legendas.",
      },
      { property: "og:title", content: "Nova Inspeção — Previna SST" },
      {
        property: "og:description",
        content: "Formulário rápido de inspeção em campo com fotos da câmera, galeria ou upload.",
      },
    ],
  }),
  component: NovaInspecaoProtegido,
});

function NovaInspecao() {
  const navigate = useNavigate();
  const [inspecaoId, setInspecaoId] = useState<string | null>(null);
  const [form, setForm] = useState({
    obra_id: "",
    data: new Date().toISOString().slice(0, 10),
    horario: "",
    responsavel: "",
    local: "",
    tipo_inspecao: "",
    observacoes: "",
  });

  const { data: obras = [] } = useQuery({ queryKey: ["obras"], queryFn: listarObras });

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        obra_id: form.obra_id || null,
        data: form.data,
        horario: form.horario || null,
        responsavel: form.responsavel || null,
        local: form.local || null,
        tipo_inspecao: form.tipo_inspecao || null,
        observacoes: form.observacoes || null,
      };
      if (inspecaoId) {
        const { error } = await supabase.from("inspecoes").update(payload).eq("id", inspecaoId);
        if (error) throw new Error(error.message);
        return inspecaoId;
      }
      const { data, error } = await supabase
        .from("inspecoes")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data.id as string;
    },
    onSuccess: (id) => {
      setInspecaoId(id);
      toast.success("Inspeção salva", { description: "Agora você pode adicionar as fotos." });
    },
    onError: (e: Error) => toast.error("Erro ao salvar", { description: e.message }),
  });

  const finalizar = useMutation({
    mutationFn: async () => {
      if (!inspecaoId) throw new Error("Salve a inspeção antes de finalizar.");
      const { error } = await supabase
        .from("inspecoes")
        .update({ status: "Concluída" })
        .eq("id", inspecaoId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Inspeção finalizada");
      if (inspecaoId) navigate({ to: "/inspecoes/$id", params: { id: inspecaoId } });
    },
    onError: (e: Error) => toast.error("Erro ao finalizar", { description: e.message }),
  });

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
            <Select value={form.obra_id} onValueChange={(v) => setForm({ ...form, obra_id: v })}>
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
            {obras.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Cadastre uma obra primeiro na tela "Obras".
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              className="h-12"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hora">Horário</Label>
            <Input
              id="hora"
              type="time"
              className="h-12"
              value={form.horario}
              onChange={(e) => setForm({ ...form, horario: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inspetor">Inspetor / responsável</Label>
            <Input
              id="inspetor"
              className="h-12"
              placeholder="Nome do profissional"
              value={form.responsavel}
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="local">Setor ou local</Label>
            <Input
              id="local"
              className="h-12"
              placeholder="Ex.: Torre B — 7º pavimento"
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="tipo">Tipo de inspeção</Label>
            <Select
              value={form.tipo_inspecao}
              onValueChange={(v) => setForm({ ...form, tipo_inspecao: v })}
            >
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
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              size="lg"
              variant={inspecaoId ? "outline" : "default"}
              className="h-12 w-full"
              disabled={salvar.isPending}
              onClick={() => salvar.mutate()}
            >
              {inspecaoId ? "Salvar alterações" : "Salvar e adicionar fotos"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens da Inspeção</CardTitle>
        </CardHeader>
        <CardContent>
          {inspecaoId ? (
            <ItensInspecao inspecaoId={inspecaoId} obraId={form.obra_id || null} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Salve os dados da inspeção para começar a adicionar os itens.
            </p>
          )}
        </CardContent>
      </Card>

      {inspecaoId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResumoInspecao inspecaoId={inspecaoId} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evidências Fotográficas gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {inspecaoId ? (
            <FotoManager
              tabela="fotos_inspecao"
              coluna="inspecao_id"
              valor={inspecaoId}
              titulo="Fotos gerais desta inspeção"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Salve os dados da inspeção para liberar o envio de fotos pela câmera, galeria ou
              upload.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background p-4 lg:static lg:border-0 lg:bg-transparent lg:p-0">
        <Button
          type="button"
          size="lg"
          className="h-14 w-full text-base"
          disabled={!inspecaoId || finalizar.isPending}
          onClick={() => finalizar.mutate()}
        >
          Finalizar Inspeção
        </Button>
      </div>
    </div>
  );
}

function NovaInspecaoProtegido() {
  return (
    <RequerPermissao permissao="criarInspecao">
      <NovaInspecao />
    </RequerPermissao>
  );
}
