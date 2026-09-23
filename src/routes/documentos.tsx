import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, FileCheck2, FileWarning, FileX2, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { SecaoColaboradores } from "@/components/ged/SecaoColaboradores";
import { SecaoDocumentosEmpresa } from "@/components/ged/SecaoDocumentosEmpresa";
import { ConfirmacaoExclusao } from "@/components/ged/ConfirmacaoExclusao";
import { PainelAlertas } from "@/components/ged/PainelAlertas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  excluirTerceirizada,
  listarDocumentosConsolidados,
  listarTerceirizadas,
  resumoDocumentos,
  contagemAlertas,
  salvarTerceirizada,
  type FiltroPrazo,
  type Terceirizada,
} from "@/lib/ged";
import { usePerfil } from "@/lib/perfil";

export const Route = createFileRoute("/documentos")({
  head: () => ({
    meta: [
      { title: "Gestão Documental (GED/SST) — Previna SST" },
      {
        name: "description",
        content:
          "Controle de validade de laudos e documentos de SST da empresa e de terceirizados, com alertas de vencimento e histórico de versões obsoletas.",
      },
      { property: "og:title", content: "Gestão Documental (GED/SST) — Previna SST" },
      {
        property: "og:description",
        content: "PGR, PCMSO, LTCAT, ASO e treinamentos com alerta automático de vencimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GestaoDocumental,
});

function CardResumo({
  titulo,
  valor,
  icone: Icone,
  tom,
}: {
  titulo: string;
  valor: number;
  icone: typeof FileCheck2;
  tom?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`grid size-10 place-items-center rounded-xl bg-muted ${tom ?? ""}`}>
          <Icone className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{titulo}</p>
          <p className="text-xl font-bold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}


function NovaTerceirizada({ onSalvo, empresa }: { onSalvo: () => void; empresa?: Terceirizada }) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ name: empresa?.name ?? "", cnpj: empresa?.cnpj ?? "", contact_email: empresa?.contact_email ?? "" });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Informe a razão social.");
      await salvarTerceirizada({
        ...(empresa ? { id: empresa.id } : {}),
        name: form.name.trim().slice(0, 150),
        cnpj: form.cnpj.trim() || null,
        contact_email: form.contact_email.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success(empresa ? "Empresa terceirizada atualizada" : "Empresa terceirizada cadastrada");
      setForm({ name: "", cnpj: "", contact_email: "" });
      setAberto(false);
      onSalvo();
    },
    onError: (e: Error) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {empresa ? <Button type="button" size="icon" variant="ghost" aria-label={`Editar ${empresa.name}`}><Pencil className="size-4" /></Button> : <Button type="button" variant="outline" className="gap-2"><Plus className="size-4" /> Nova empresa terceirizada</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{empresa ? "Editar empresa terceirizada" : "Cadastrar empresa terceirizada"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ter-nome">Razão social</Label>
            <Input
              id="ter-nome"
              className="h-12"
              maxLength={150}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ter-cnpj">CNPJ</Label>
            <Input
              id="ter-cnpj"
              className="h-12"
              maxLength={20}
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ter-email">E-mail de contato</Label>
            <Input
              id="ter-email"
              className="h-12"
              maxLength={150}
              placeholder="contato@empresa.com.br"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
          </div>
          <Button
            type="button"
            className="h-12 w-full"
            disabled={salvar.isPending}
            onClick={() => salvar.mutate()}
          >
            {empresa ? "Salvar alterações" : "Salvar empresa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GestaoDocumental() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [terceirizadaId, setTerceirizadaId] = useState<string>("");
  const [filtroPrazo, setFiltroPrazo] = useState<FiltroPrazo>("todos");
  const { adminPrincipal, perfil, isLoading: carregandoPerfil } = usePerfil();
  const nomeEmpresaPropria =
    adminPrincipal && !carregandoPerfil && perfil?.empresa?.trim()
      ? perfil.empresa.trim()
      : "Empresa Própria";


  const { data: todos = [] } = useQuery({
    queryKey: ["ged-resumo"],
    queryFn: listarDocumentosConsolidados,
  });
  const { data: terceirizadas = [] } = useQuery({
    queryKey: ["ged-terceirizadas"],
    queryFn: listarTerceirizadas,
  });

  const resumo = resumoDocumentos(todos);
  const alertas = contagemAlertas(todos);

  const removerEmpresa = useMutation({
    mutationFn: (id: string) => excluirTerceirizada(id),
    onSuccess: () => {
      toast.success("Empresa excluída");
      setTerceirizadaId("");
      qc.invalidateQueries({ queryKey: ["ged-terceirizadas"] });
      qc.invalidateQueries({ queryKey: ["ged-resumo"] });
    },
    onError: (e: Error) => toast.error("Não foi possível excluir", { description: e.message }),
  });

  const selecionada = terceirizadas.find((t) => t.id === terceirizadaId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão Documental (GED/SST)"
        description="Controle a validade dos laudos e documentos da empresa e dos terceirizados."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <CardResumo titulo="Total de documentos" valor={resumo.total} icone={FileCheck2} />
        <CardResumo
          titulo="A vencer em 30 dias"
          valor={resumo.aVencer}
          icone={FileWarning}
          tom="text-warning"
        />
        <CardResumo
          titulo="Vencidos"
          valor={resumo.vencidos}
          icone={FileX2}
          tom="text-destructive"
        />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Central de alertas de validade</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {([
            ["todos", "Todos", resumo.total],
            ["vencidos", "Vencidos", alertas.vencidos],
            ["7", "Vencem em 7 dias", alertas.sete],
            ["15", "Vencem em 15 dias", alertas.quinze],
            ["30", "Vencem em 30 dias", alertas.trinta],
          ] as const).map(([valor, rotulo, total]) => (
            <Button key={valor} type="button" variant={filtroPrazo === valor ? "default" : "outline"} size="sm" onClick={() => setFiltroPrazo(valor)}>
              {rotulo} <span className="ml-2 rounded-full bg-background/20 px-1.5">{total}</span>
            </Button>
          ))}
        </CardContent>
        <CardContent className="pt-0">
          <PainelAlertas
            documentos={todos}
            filtro={filtroPrazo}
            podeAlterar={adminPrincipal && !carregandoPerfil}
            onMudou={async () => {
              await qc.invalidateQueries({ queryKey: ["ged-resumo"] });
            }}
          />
        </CardContent>
      </Card>

      <Input
        className="h-12 max-w-md"
        placeholder="Buscar por documento, colaborador ou CPF"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <Tabs defaultValue="propria">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="propria" className="max-w-[16rem] gap-2 py-2" title={nomeEmpresaPropria}>
            <Building2 className="size-4 shrink-0" />
            <span className="truncate">{nomeEmpresaPropria}</span>
          </TabsTrigger>

          <TabsTrigger value="terceirizados" className="gap-2 py-2">
            <Truck className="size-4" /> Terceirizados / Prestadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="propria" className="mt-4 space-y-4">
          <SecaoDocumentosEmpresa contractorId={null} busca={busca} podeAlterar={adminPrincipal} filtroPrazo={filtroPrazo} nomeEmpresa={nomeEmpresaPropria} />
          <SecaoColaboradores contractorId={null} busca={busca} podeAlterar={adminPrincipal} filtroPrazo={filtroPrazo} />
        </TabsContent>

        <TabsContent value="terceirizados" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Empresa terceirizada</CardTitle>
              {adminPrincipal ? <NovaTerceirizada
                onSalvo={() => qc.invalidateQueries({ queryKey: ["ged-terceirizadas"] })}
              /> : null}
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Select value={terceirizadaId} onValueChange={setTerceirizadaId}>
                <SelectTrigger className="h-12 w-full max-w-sm">
                  <SelectValue placeholder="Selecione a empresa (nome / CNPJ)" />
                </SelectTrigger>
                <SelectContent>
                  {terceirizadas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.cnpj ? ` — ${t.cnpj}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selecionada ? (
                adminPrincipal ? <>
                  <NovaTerceirizada empresa={selecionada} onSalvo={() => qc.invalidateQueries({ queryKey: ["ged-terceirizadas"] })} />
                  <ConfirmacaoExclusao nome={`“${selecionada.name}” e todos os seus dados`} onConfirmar={() => removerEmpresa.mutateAsync(selecionada.id)} disabled={removerEmpresa.isPending}>
                    <Button type="button" size="icon" variant="ghost" aria-label="Excluir empresa terceirizada"><Trash2 className="size-4 text-destructive" /></Button>
                  </ConfirmacaoExclusao>
                </> : null
              ) : null}
              {terceirizadas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Cadastre a primeira empresa terceirizada para anexar documentos.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {selecionada ? (
            <>
               <SecaoDocumentosEmpresa contractorId={selecionada.id} busca={busca} podeAlterar={adminPrincipal && !carregandoPerfil} filtroPrazo={filtroPrazo} nomeEmpresa={selecionada.name} />
               <SecaoColaboradores contractorId={selecionada.id} busca={busca} podeAlterar={adminPrincipal && !carregandoPerfil} filtroPrazo={filtroPrazo} />
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
