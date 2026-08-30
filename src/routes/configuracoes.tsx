import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Lock, ShieldAlert, SlidersHorizontal, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { excluirMinhaConta } from "@/lib/conta.functions";
import { alterarSenha, usePerfil } from "@/lib/perfil";

export const Route = createFileRoute("/configuracoes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Configurações — Previna SST" },
      {
        name: "description",
        content: "Preferências, segurança da conta e exclusão de conta no Previna SST.",
      },
      { property: "og:title", content: "Configurações — Previna SST" },
      {
        property: "og:description",
        content: "Preferências, segurança da conta e exclusão de conta no Previna SST.",
      },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const navigate = useNavigate();
  const { perfil, adminPrincipal } = usePerfil();
  const excluir = useServerFn(excluirMinhaConta);

  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [dialogo, setDialogo] = useState(false);
  const [prefs, setPrefs] = useState({ email: true, prazos: true, resumo: false });

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

  const apagarConta = useMutation({
    mutationFn: async () => {
      if (confirmacao.trim().toUpperCase() !== "EXCLUIR") {
        throw new Error('Digite EXCLUIR para confirmar.');
      }
      await excluir({});
    },
    onSuccess: async () => {
      toast.success("Conta excluída");
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    },
    onError: (e: Error) => toast.error("Não foi possível excluir a conta", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Perfil, segurança, preferências e conta."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4" /> Configurações do perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {perfil?.nome || perfil?.email} · {perfil?.cargo || "Cargo não informado"}
            {perfil?.empresa ? ` · ${perfil.empresa}` : ""}
          </p>
          <Button asChild size="lg" variant="outline" className="h-12 w-full sm:w-auto">
            <Link to="/perfil">Editar meu perfil</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4" /> Segurança — alterar senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cs1">Nova senha</Label>
              <Input
                id="cs1"
                type="password"
                className="h-12"
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs2">Confirmar nova senha</Label>
              <Input
                id="cs2"
                type="password"
                className="h-12"
                minLength={6}
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="lg"
            className="h-12 w-full sm:w-auto"
            disabled={trocarSenha.isPending}
            onClick={() => trocarSenha.mutate()}
          >
            Alterar senha
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" /> Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { chave: "email" as const, titulo: "Avisos por e-mail", desc: "Comunicados importantes da conta." },
            { chave: "prazos" as const, titulo: "Alertas de prazo", desc: "Ações corretivas próximas do vencimento." },
            { chave: "resumo" as const, titulo: "Resumo semanal", desc: "Resumo das inspeções da semana." },
          ].map((p) => (
            <div key={p.chave} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{p.titulo}</p>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
              <Switch
                checked={prefs[p.chave]}
                onCheckedChange={(v) => setPrefs({ ...prefs, [p.chave]: v })}
                aria-label={p.titulo}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Preferências aplicadas a este dispositivo. O envio automático de e-mails será ativado em
            uma próxima etapa.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="size-4" /> Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Aplicativo: Previna SST</p>
          <p>Idioma: Português (Brasil)</p>
          <p>
            Tipo de acesso:{" "}
            {adminPrincipal ? "Administradora principal (acesso global)" : "Usuário padrão"}
          </p>
          <p>Seus dados são visíveis apenas para você e para a administradora principal.</p>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <ShieldAlert className="size-4" /> Excluir minha conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A exclusão é definitiva e poderá remover ou desvincular os dados associados à sua conta,
            como obras, inspeções, não conformidades, ações corretivas e fotos.
          </p>
          {adminPrincipal ? (
            <p className="text-sm font-medium">
              A conta da administradora principal é protegida e não pode ser excluída pelo sistema.
            </p>
          ) : (
            <Button variant="destructive" size="lg" className="h-12 w-full sm:w-auto" onClick={() => setDialogo(true)}>
              Excluir minha conta
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tem certeza que deseja excluir sua conta?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. Para confirmar, digite <strong>EXCLUIR</strong> abaixo.
            </p>
            <Input
              className="h-12"
              value={confirmacao}
              placeholder="EXCLUIR"
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="lg" className="h-12" onClick={() => setDialogo(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="h-12"
              disabled={apagarConta.isPending}
              onClick={() => apagarConta.mutate()}
            >
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
