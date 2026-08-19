import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HardHat, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — SafeCheck" },
      {
        name: "description",
        content:
          "Acesse o SafeCheck para registrar inspeções de segurança do trabalho, fotos e não conformidades.",
      },
      { property: "og:title", content: "Entrar — SafeCheck" },
      {
        property: "og:description",
        content: "Acesse sua conta SafeCheck e gerencie inspeções de segurança do trabalho.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) toast.error("Não foi possível entrar", { description: error.message });
    else navigate({ to: "/" });
  };

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome, empresa },
      },
    });
    setEnviando(false);
    if (error) toast.error("Não foi possível cadastrar", { description: error.message });
    else toast.success("Conta criada", { description: "Você já pode acessar o SafeCheck." });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <HardHat className="size-5" />
          </div>
          <span className="font-display text-2xl font-bold">SafeCheck</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acesso ao sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="criar">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar">
                <form onSubmit={entrar} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      className="h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      required
                      className="h-12"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-12 w-full" disabled={enviando}>
                    {enviando ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="criar">
                <form onSubmit={cadastrar} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      className="h-12"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      className="h-12"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email2">E-mail</Label>
                    <Input
                      id="email2"
                      type="email"
                      required
                      className="h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="senha2">Senha</Label>
                    <Input
                      id="senha2"
                      type="password"
                      required
                      minLength={6}
                      className="h-12"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-12 w-full" disabled={enviando}>
                    {enviando ? <Loader2 className="size-4 animate-spin" /> : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
