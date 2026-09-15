import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, ClipboardList, Users } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatarData } from "@/lib/db";
import { listarUsuariosAdmin } from "@/lib/admin.functions";
import { usePerfil } from "@/lib/perfil";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Previna SST" },
      {
        name: "description",
        content: "Métricas gerais e gestão de usuários cadastrados no Previna SST.",
      },
      { property: "og:title", content: "Painel Administrativo — Previna SST" },
      {
        property: "og:description",
        content: "Total de usuários, inspeções e obras ativas do Previna SST.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { adminPrincipal, isLoading: carregandoPerfil } = usePerfil();
  const buscarUsuarios = useServerFn(listarUsuariosAdmin);
  const [busca, setBusca] = useState("");

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: () => buscarUsuarios(),
    enabled: adminPrincipal,
  });

  const { data: totais } = useQuery({
    queryKey: ["admin-totais"],
    queryFn: async () => {
      const [inspecoes, obras] = await Promise.all([
        supabase.from("inspecoes").select("id", { count: "exact", head: true }),
        supabase
          .from("obras")
          .select("id", { count: "exact", head: true })
          .eq("status", "Em andamento"),
      ]);
      return { inspecoes: inspecoes.count ?? 0, obras: obras.count ?? 0 };
    },
    enabled: adminPrincipal,
  });

  if (carregandoPerfil) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!adminPrincipal)
    return (
      <p className="text-sm text-muted-foreground">
        Esta área é restrita à administradora principal.
      </p>
    );

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? usuarios.filter(
        (u) =>
          u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo),
      )
    : usuarios;

  const cards = [
    { rotulo: "Usuários cadastrados", valor: usuarios.length, icone: Users },
    { rotulo: "Inspeções realizadas", valor: totais?.inspecoes ?? 0, icone: ClipboardList },
    { rotulo: "Obras ativas", valor: totais?.obras ?? 0, icone: Building2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel Administrativo"
        description="Visão geral do uso do Previna SST e dos usuários cadastrados."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.rotulo}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <c.icone className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{c.valor}</p>
                <p className="truncate text-sm text-muted-foreground">{c.rotulo}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Input
        className="h-12"
        placeholder="Buscar por nome ou e-mail"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando usuários...</p> : null}

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cargo / Função</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.cargo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatarData(u.criadoEm.slice(0, 10))}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={u.ativo ? "Ativo" : "Inativo"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:hidden">
        {filtrados.map((u) => (
          <Card key={u.id}>
            <CardContent className="space-y-1 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="truncate font-semibold">{u.nome}</p>
                <StatusBadge value={u.ativo ? "Ativo" : "Inativo"} />
              </div>
              <p className="break-all text-sm text-muted-foreground">{u.email}</p>
              <p className="text-sm">{u.cargo}</p>
              <p className="text-sm text-muted-foreground">
                {formatarData(u.criadoEm.slice(0, 10))}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
