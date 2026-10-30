import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, Printer, Plus, Trash2, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { ConfirmacaoExclusao } from "@/components/ged/ConfirmacaoExclusao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listarColaboradores, type Colaborador } from "@/lib/ged";
import { usePerfil } from "@/lib/perfil";
import {
  criarLista,
  excluirLista,
  listarListas,
  listarParticipantes,
  ordenarParticipantes,
  type ListaPresenca,
  type NovoParticipante,
} from "@/lib/presenca";

export const Route = createFileRoute("/lista-presenca")({
  head: () => ({
    meta: [
      { title: "Lista de Presença / Treinamento — Previna SST" },
      {
        name: "description",
        content:
          "Crie e emita listas de presença para treinamentos, DDS e integrações de NR, com participantes da Gestão Documental e impressão em PDF.",
      },
      { property: "og:title", content: "Lista de Presença / Treinamento — Previna SST" },
      {
        property: "og:description",
        content: "Listas de presença de treinamentos e DDS prontas para auditoria de SST.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaginaListaPresenca,
});

function formatarData(iso: string | null) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function htmlImpressao(lista: ListaPresenca, participantes: { nome: string; funcao: string | null }[]) {
  const linhas = participantes
    .map(
      (p, i) => `<tr>
        <td class="num">${i + 1}</td>
        <td>${p.nome}</td>
        <td>${p.funcao ?? ""}</td>
        <td class="ass"></td>
      </tr>`,
    )
    .join("");
  const vazias = Array.from({ length: Math.max(0, 10 - participantes.length) })
    .map(
      (_, i) => `<tr>
        <td class="num">${participantes.length + i + 1}</td>
        <td></td><td></td><td class="ass"></td>
      </tr>`,
    )
    .join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Lista de Treinamento - ${lista.tema}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1c1917; margin: 0; }
  h1 { text-align: center; font-size: 20px; letter-spacing: 2px; margin: 0 0 4px; text-transform: uppercase; }
  .sub { text-align: center; font-size: 11px; color: #57534e; margin-bottom: 14px; }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  table.info td { border: 1px solid #a8a29e; padding: 6px 8px; font-size: 12px; }
  table.info td b { display: block; font-size: 9px; text-transform: uppercase; color: #57534e; letter-spacing: 1px; }
  .tema { border: 1px solid #a8a29e; padding: 8px; font-size: 12px; margin-bottom: 14px; min-height: 44px; }
  .tema b { display: block; font-size: 9px; text-transform: uppercase; color: #57534e; letter-spacing: 1px; margin-bottom: 4px; }
  table.part { width: 100%; border-collapse: collapse; }
  table.part th, table.part td { border: 1px solid #44403c; padding: 7px 8px; font-size: 12px; text-align: left; }
  table.part th { background: #e7e5e4; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
  td.num { width: 36px; text-align: center; }
  td.ass { width: 220px; }
  .rodape { margin-top: 28px; display: flex; justify-content: space-between; gap: 40px; }
  .assinatura { flex: 1; text-align: center; font-size: 11px; }
  .assinatura .linha { border-top: 1px solid #1c1917; margin-bottom: 4px; padding-top: 2px; }
</style></head><body>
<h1>Lista de Treinamento</h1>
<p class="sub">Previna SST — Controle de Presença em Treinamentos, DDS e Integrações</p>
<table class="info"><tr>
  <td><b>Empresa</b>${lista.empresa ?? ""}</td>
  <td><b>Local</b>${lista.local ?? ""}</td>
  <td><b>Data</b>${formatarData(lista.data)}</td>
  <td><b>Horário</b>${lista.horario ?? ""}</td>
  <td><b>Carga Horária</b>${lista.carga_horaria ?? ""}</td>
</tr></table>
<div class="tema"><b>Descrição / Tema do Treinamento</b>${lista.tema}</div>
<table class="part">
  <thead><tr><th style="width:36px">Nº</th><th>Nome Completo do Participante</th><th style="width:220px">Função / Cargo</th><th style="width:220px">Assinatura</th></tr></thead>
  <tbody>${linhas}${vazias}</tbody>
</table>
<div class="rodape">
  <div class="assinatura"><div class="linha"></div>Responsável pelo Treinamento</div>
  <div class="assinatura"><div class="linha"></div>Responsável pela Empresa / Obra</div>
</div>
<script>window.onload = () => { window.print(); };</script>
</body></html>`;
}

function imprimirLista(lista: ListaPresenca, participantes: { nome: string; funcao: string | null }[]) {
  const janela = window.open("", "_blank", "width=1100,height=800");
  if (!janela) {
    toast.error("O navegador bloqueou a janela de impressão. Permita pop-ups e tente de novo.");
    return;
  }
  janela.document.write(htmlImpressao(lista, participantes));
  janela.document.close();
}

function PaginaListaPresenca() {
  const queryClient = useQueryClient();
  const { perfil, adminPrincipal, isLoading: carregandoPerfil } = usePerfil();
  const [aberta, setAberta] = useState(false);
  const [visualizando, setVisualizando] = useState<ListaPresenca | null>(null);

  const { data: listas = [], isLoading } = useQuery({
    queryKey: ["listas-presenca"],
    queryFn: listarListas,
  });

  const mutExcluir = useMutation({
    mutationFn: (id: string) => excluirLista(id),
    onSuccess: () => {
      toast.success("Lista excluída.");
      queryClient.invalidateQueries({ queryKey: ["listas-presenca"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const podeExcluir = (lista: ListaPresenca) =>
    !carregandoPerfil && (adminPrincipal || (!!perfil?.id && perfil.id === lista.user_id));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Lista de Presença / Treinamento"
        description="Crie e emita listas de presença para treinamentos, DDS e integrações de NR."
      />

      <div className="flex justify-end">
        <Dialog open={aberta} onOpenChange={setAberta}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="size-5" /> Nova Lista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-bold uppercase tracking-widest">
                Lista de Treinamento
              </DialogTitle>
            </DialogHeader>
            <FormularioLista
              empresaPadrao={perfil?.empresa ?? ""}
              onSalvo={() => {
                setAberta(false);
                queryClient.invalidateQueries({ queryKey: ["listas-presenca"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando listas…</p>
      ) : listas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardList className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma lista de presença criada ainda. Clique em "Nova Lista" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {listas.map((lista) => (
            <Card key={lista.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-2">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base uppercase">{lista.tema}</CardTitle>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" /> {formatarData(lista.data)}
                    </span>
                    {lista.local && <span className="truncate">{lista.local}</span>}
                    {lista.empresa && <span className="truncate font-medium">{lista.empresa}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setVisualizando(lista)}>
                    <Users className="size-4" /> Abrir
                  </Button>
                  {podeExcluir(lista) && (
                    <ConfirmacaoExclusao
                      nome={`a lista "${lista.tema}" e todos os participantes`}
                      onConfirmar={() => mutExcluir.mutateAsync(lista.id).then(() => undefined)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        aria-label="Excluir lista"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </ConfirmacaoExclusao>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <DialogoVisualizacao lista={visualizando} onFechar={() => setVisualizando(null)} />
    </div>
  );
}

function FormularioLista({
  empresaPadrao,
  onSalvo,
}: {
  empresaPadrao: string;
  onSalvo: () => void;
}) {
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [empresa, setEmpresa] = useState(empresaPadrao);
  const [horario, setHorario] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [tema, setTema] = useState("");
  const [participantes, setParticipantes] = useState<NovoParticipante[]>([]);
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [nomeManual, setNomeManual] = useState("");
  const [funcaoManual, setFuncaoManual] = useState("");

  const { data: colaboradores = [] } = useQuery({
    queryKey: ["colaboradores-presenca"],
    queryFn: () => listarColaboradores(null),
  });

  const mutCriar = useMutation({
    mutationFn: () =>
      criarLista(
        { local, data, empresa, horario, carga_horaria: cargaHoraria, tema },
        ordenarParticipantes(participantes),
      ),
    onSuccess: () => {
      toast.success("Lista de presença criada.");
      onSalvo();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternarColaborador = (c: Colaborador, marcado: boolean) => {
    setSelecionados((s) => ({ ...s, [c.id]: marcado }));
    if (marcado) {
      setParticipantes((p) =>
        p.some((x) => x.employee_id === c.id)
          ? p
          : [...p, { nome: c.name, funcao: c.role_title ?? "", employee_id: c.id }],
      );
    } else {
      setParticipantes((p) => p.filter((x) => x.employee_id !== c.id));
    }
  };

  const adicionarManual = () => {
    const nome = nomeManual.trim();
    if (!nome) return;
    setParticipantes((p) => [...p, { nome, funcao: funcaoManual.trim(), employee_id: null }]);
    setNomeManual("");
    setFuncaoManual("");
  };

  const salvar = () => {
    if (!tema.trim()) {
      toast.error("Informe a descrição / tema do treinamento.");
      return;
    }
    mutCriar.mutate();
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lp-empresa">Empresa</Label>
          <Input id="lp-empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lp-local">Local</Label>
          <Input id="lp-local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Obra / sala de treinamento" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lp-data">Data</Label>
          <Input id="lp-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lp-horario">Horário</Label>
            <Input id="lp-horario" value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="07:30" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lp-carga">Carga Horária</Label>
            <Input id="lp-carga" value={cargaHoraria} onChange={(e) => setCargaHoraria(e.target.value)} placeholder="4h" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lp-tema">Descrição / Tema do Treinamento *</Label>
        <Textarea
          id="lp-tema"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Ex: Treinamento de NR-35 — Trabalho em Altura; DDS de conscientização sobre uso de EPI…"
          rows={3}
        />
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <p className="text-sm font-semibold">Participantes</p>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Puxar cadastrados (Gestão Documental)
          </p>
          <div className="max-h-44 space-y-1 overflow-y-auto overscroll-contain rounded-lg border p-2" onWheel={(e) => e.stopPropagation()}>
            {colaboradores.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                Nenhum colaborador cadastrado na empresa própria.
              </p>
            ) : (
              colaboradores.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                  <Checkbox
                    checked={!!selecionados[c.id]}
                    onCheckedChange={(v) => alternarColaborador(c, v === true)}
                  />
                  <span className="truncate uppercase">{c.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{c.role_title}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Inclusão manual (avulso / visitante)
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={nomeManual}
              onChange={(e) => setNomeManual(e.target.value)}
              placeholder="Nome completo"
              className="uppercase"
            />
            <Input
              value={funcaoManual}
              onChange={(e) => setFuncaoManual(e.target.value)}
              placeholder="Função / cargo"
              className="uppercase sm:max-w-44"
            />
            <Button type="button" variant="secondary" className="gap-1.5" onClick={adicionarManual}>
              <UserPlus className="size-4" /> Adicionar
            </Button>
          </div>
        </div>

        {participantes.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-10 px-3 py-2">Nº</th>
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Função</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {ordenarParticipantes(participantes).map((p, i) => (
                  <tr key={`${p.employee_id ?? "manual"}-${p.nome}-${i}`} className="border-t">
                    <td className="px-3 py-2 text-center">{i + 1}</td>
                    <td className="px-3 py-2 uppercase">{p.nome}</td>
                    <td className="px-3 py-2 uppercase">{p.funcao}</td>
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Remover participante"
                        onClick={() =>
                          setParticipantes((atual) =>
                            p.employee_id
                              ? atual.filter((x) => x.employee_id !== p.employee_id)
                              : atual.filter((x, j) => !(x.nome === p.nome && j === i)),
                          )
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Button size="lg" className="w-full" onClick={salvar} disabled={mutCriar.isPending}>
        {mutCriar.isPending ? "Salvando…" : "Salvar Lista de Presença"}
      </Button>
    </div>
  );
}

function DialogoVisualizacao({ lista, onFechar }: { lista: ListaPresenca | null; onFechar: () => void }) {
  const { data: participantes = [], isLoading } = useQuery({
    queryKey: ["participantes-lista", lista?.id],
    queryFn: () => listarParticipantes(lista!.id),
    enabled: !!lista,
  });

  return (
    <Dialog open={!!lista} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold uppercase tracking-widest">
            Lista de Treinamento
          </DialogTitle>
        </DialogHeader>
        {lista && (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-xl border p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Empresa</p>
                <p className="font-medium">{lista.empresa || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Local</p>
                <p className="font-medium">{lista.local || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Data</p>
                <p className="font-medium">{formatarData(lista.data)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Horário</p>
                <p className="font-medium">{lista.horario || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Carga Horária</p>
                <p className="font-medium">{lista.carga_horaria || "—"}</p>
              </div>
            </div>

            <div className="rounded-xl border p-4 text-sm">
              <p className="text-xs uppercase text-muted-foreground">Descrição / Tema</p>
              <p className="mt-1 whitespace-pre-line font-medium uppercase">{lista.tema}</p>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="w-10 px-3 py-2">Nº</th>
                    <th className="px-3 py-2">Nome Completo</th>
                    <th className="px-3 py-2">Função / Cargo</th>
                    <th className="w-40 px-3 py-2">Assinatura</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        Carregando participantes…
                      </td>
                    </tr>
                  ) : participantes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        Nenhum participante nesta lista.
                      </td>
                    </tr>
                  ) : (
                    participantes.map((p, i) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-2 text-center">{i + 1}</td>
                        <td className="px-3 py-2 uppercase">{p.nome}</td>
                        <td className="px-3 py-2 uppercase">{p.funcao}</td>
                        <td className="px-3 py-2" />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => imprimirLista(lista, participantes)}
              disabled={isLoading}
            >
              <Printer className="size-5" /> Imprimir / Gerar PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
