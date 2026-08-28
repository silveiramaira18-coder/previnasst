import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AvatarPerfil } from "@/components/AvatarPerfil";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET } from "@/lib/fotos";
import { alterarSenha, CARGOS, rotuloPapel, salvarPerfil, usePerfil } from "@/lib/perfil";

export const Route = createFileRoute("/perfil")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Meu Perfil — Previna SST" },
      {
        name: "description",
        content:
          "Atualize seu nome, cargo, empresa, foto de perfil e senha de acesso ao Previna SST.",
      },
      { property: "og:title", content: "Meu Perfil — Previna SST" },
      {
        property: "og:description",
        content: "Gerencie seus dados de usuário e a segurança da sua conta no Previna SST.",
      },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const qc = useQueryClient();
  const { perfil, isLoading } = usePerfil();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nome: "", empresa: "", cargo: "", telefone: "" });
  const [cargoOutro, setCargoOutro] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");

  const preencher = () => {
    if (!perfil) return;
    const cargoConhecido = perfil.cargo && CARGOS.includes(perfil.cargo);
    setForm({
      nome: perfil.nome ?? "",
      empresa: perfil.empresa ?? "",
      cargo: perfil.cargo ? (cargoConhecido ? perfil.cargo : "Outro") : "",
      telefone: perfil.telefone ?? "",
    });
    setCargoOutro(perfil.cargo && !cargoConhecido ? perfil.cargo : "");
  };

  useEffect(preencher, [perfil]);

  const cargoFinal = form.cargo === "Outro" ? cargoOutro.trim() : form.cargo;

  const salvar = useMutation({
    mutationFn: () =>
      salvarPerfil({
        nome: form.nome,
        empresa: form.empresa,
        telefone: form.telefone,
        cargo: cargoFinal || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perfil"] });
      setEditando(false);
      toast.success("Perfil atualizado");
    },
    onError: (e: Error) => toast.error("Erro ao salvar", { description: e.message }),
  });

  const enviarFoto = useMutation({
    mutationFn: async (arquivo: File) => {
      if (!perfil) throw new Error("Sessão expirada.");
      const ext = arquivo.name.split(".").pop() ?? "jpg";
      const caminho = `${perfil.id}/perfil/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo, { contentType: arquivo.type || "image/jpeg" });
      if (error) throw new Error(error.message);
      await salvarPerfil({
        nome: form.nome,
        empresa: form.empresa,
        telefone: form.telefone,
        cargo: cargoFinal || null,
        avatar_url: caminho,
      });
      if (perfil.avatar_url) await supabase.storage.from(BUCKET).remove([perfil.avatar_url]);
      return caminho;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Foto de perfil atualizada");
    },
    onError: (e: Error) => toast.error("Erro ao enviar foto", { description: e.message }),
  });

  const removerFoto = useMutation({
    mutationFn: async () => {
      if (!perfil?.avatar_url) return;
      await supabase.storage.from(BUCKET).remove([perfil.avatar_url]);
      await salvarPerfil({
        nome: form.nome,
        empresa: form.empresa,
        telefone: form.telefone,
        cargo: cargoFinal || null,
        avatar_url: null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Foto removida");
    },
    onError: (e: Error) => toast.error("Erro ao remover foto", { description: e.message }),
  });

  const trocarSenha = useMutation({
    mutationFn: async () => {
      if (senha.length < 6) throw new Error("A senha deve ter ao menos 6 caracteres.");
      if (senha !== senha2) throw new Error("As senhas não conferem.");
      await alterarSenha(senha);
    },
    onSuccess: () => {
      setSenha("");
      setSenha2("");
      toast.success("Senha alterada com sucesso");
    },
    onError: (e: Error) => toast.error("Erro ao alterar senha", { description: e.message }),
  });

  if (isLoading || !perfil) {
    return <p className="text-sm text-muted-foreground">Carregando perfil...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        description="Seus dados de acesso ao Previna SST."
        action={
          editando ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                preencher();
                setEditando(false);
              }}
            >
              Cancelar edição
            </Button>
          ) : (
            <Button size="lg" className="gap-2" onClick={() => setEditando(true)}>
              <Pencil className="size-4" /> Editar perfil
            </Button>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <AvatarPerfil
                caminho={perfil.avatar_url}
                nome={form.nome || perfil.email}
                className="size-20 text-xl"
              />
              <Button
                type="button"
                size="icon"
                className="absolute -bottom-1 -right-1 size-9 rounded-full"
                aria-label="Alterar foto de perfil"
                disabled={enviarFoto.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {enviarFoto.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) enviarFoto.mutate(f);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{form.nome || "Sem nome"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {perfil.cargo || "Cargo não informado"}
              </p>
              <p className="truncate text-sm text-muted-foreground">{perfil.email}</p>
              <Badge variant="secondary" className="mt-2 gap-1">
                <ShieldCheck className="size-3.5" /> {rotuloPapel[perfil.papel]}
              </Badge>
            </div>
            {perfil.avatar_url ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={removerFoto.isPending}
                onClick={() => removerFoto.mutate()}
              >
                <Trash2 className="size-3.5" /> Remover foto
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                className="h-12"
                value={form.nome}
                maxLength={100}
                disabled={!editando}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" className="h-12" value={perfil.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Select
                value={form.cargo}
                disabled={!editando}
                onValueChange={(v) => setForm({ ...form, cargo: v })}
              >
                <SelectTrigger className="h-12 w-full">
                  <SelectValue placeholder="Selecione seu cargo" />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.cargo === "Outro" ? (
                <Input
                  className="mt-2 h-12"
                  placeholder="Informe seu cargo"
                  maxLength={80}
                  disabled={!editando}
                  value={cargoOutro}
                  onChange={(e) => setCargoOutro(e.target.value)}
                />
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                className="h-12"
                value={form.empresa}
                maxLength={120}
                disabled={!editando}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                className="h-12"
                value={form.telefone}
                maxLength={30}
                disabled={!editando}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
          </div>

          {editando ? (
            <Button
              size="lg"
              className="h-12 w-full sm:w-auto"
              disabled={salvar.isPending}
              onClick={() => salvar.mutate()}
            >
              Salvar alterações
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ns">Nova senha</Label>
              <Input
                id="ns"
                type="password"
                className="h-12"
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ns2">Confirmar nova senha</Label>
              <Input
                id="ns2"
                type="password"
                className="h-12"
                minLength={6}
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full sm:w-auto"
            disabled={trocarSenha.isPending}
            onClick={() => trocarSenha.mutate()}
          >
            Alterar senha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
