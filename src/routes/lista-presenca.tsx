import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, Printer, Plus, Trash2, Users, Pencil, Download, PenLine, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmacaoExclusao } from "@/components/ged/ConfirmacaoExclusao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormularioLista } from "@/components/presenca/FormularioLista";
import { AssinaturaParticipante } from "@/components/presenca/AssinaturaParticipante";
import { DialogoAssinatura } from "@/components/presenca/DialogoAssinatura";
import { CadastroLogo, LogoEmpresa, useLogoEmpresa } from "@/components/presenca/LogoEmpresa";
import { usePerfil } from "@/lib/perfil";
import { excluirLista, listarListas, listarParticipantes, alterarModoAssinatura, salvarAssinaturaInstrutor, type ListaPresenca, type Participante } from "@/lib/presenca";
import { FILTRO_LISTAS_VAZIO, TODAS_OBRAS, filtrarListas, obrasDasListas, podeEditarLista, type FiltroListas } from "@/lib/presenca-regras";
import { baixarPdfLista, imprimirLista } from "@/lib/presenca-export";

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

function formatarData(iso: string | null) { return iso ? iso.split("-").reverse().join("/") : "—"; }
function PaginaListaPresenca() {
  const qc = useQueryClient();
  const { perfil, adminPrincipal } = usePerfil();
  const [nova, setNova] = useState(false);
  const [aberta, setAberta] = useState<ListaPresenca | null>(null);
  const [filtro, setFiltro] = useState<FiltroListas>(FILTRO_LISTAS_VAZIO);
  const { data: logo } = useLogoEmpresa();
  const { data: listas = [], isLoading, error } = useQuery({ queryKey: ["listas-presenca", perfil?.id], queryFn: listarListas, enabled: !!perfil });
  const atualizar = () => { void qc.invalidateQueries({ queryKey: ["listas-presenca"] }); };
  const obras = useMemo(() => obrasDasListas(listas), [listas]);
  const visiveis = useMemo(() => filtrarListas(listas, filtro), [listas, filtro]);
  const filtrando = filtro.obra !== TODAS_OBRAS || !!filtro.busca || !!filtro.de || !!filtro.ate;
  const limparFiltros = () => setFiltro(FILTRO_LISTAS_VAZIO);
  return <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6"><LogoEmpresa url={logo} /><PageHeader title="Lista de Presença / Treinamento" />
  <div className="flex flex-wrap justify-end gap-2"><CadastroLogo onSalvo={() => { void qc.invalidateQueries({ queryKey: ["perfil"] }); void qc.invalidateQueries({ queryKey: ["logo-empresa"] }); }} /><Button size="lg" onClick={() => setNova(true)}><Plus className="size-5" /> Nova Lista</Button></div>
  {error ? <p className="text-destructive">Não foi possível carregar as listas: {error.message}</p> : isLoading ? <p>Carregando listas…</p> : !listas.length ? <div className="py-12 text-center text-muted-foreground"><ClipboardList className="mx-auto mb-3 size-10" />Nenhuma lista de presença cadastrada.</div> : <><Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
    <div className="space-y-1.5"><Label>Obra</Label><Select value={filtro.obra} onValueChange={obra => setFiltro(f => ({ ...f, obra }))}><SelectTrigger className="h-12 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={TODAS_OBRAS}>Todas as obras</SelectItem>{obras.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1.5"><Label htmlFor="lp-filtro-nome">Nome do treinamento</Label><Input id="lp-filtro-nome" className="h-12" placeholder="Ex.: NR-35, DDS ou integração" value={filtro.busca} onChange={e => setFiltro(f => ({ ...f, busca: e.target.value }))} /></div>
    <div className="space-y-1.5"><Label htmlFor="lp-filtro-de">Data de</Label><Input id="lp-filtro-de" type="date" className="h-12" value={filtro.de} onChange={e => setFiltro(f => ({ ...f, de: e.target.value }))} /></div>
    <div className="space-y-1.5"><Label htmlFor="lp-filtro-ate">Data até</Label><Input id="lp-filtro-ate" type="date" className="h-12" value={filtro.ate} onChange={e => setFiltro(f => ({ ...f, ate: e.target.value }))} /></div>
    <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2 xl:col-span-4"><p className="text-sm text-muted-foreground">{visiveis.length} de {listas.length} lista(s) encontrada(s).</p>{filtrando && <Button variant="ghost" size="sm" onClick={limparFiltros}><X className="size-4" /> Limpar filtros</Button>}</div>
  </CardContent></Card>{visiveis.length ? <div className="grid gap-3">{visiveis.map(lista => <Card key={lista.id}><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><CardTitle className="break-words text-base uppercase">{lista.nome_treinamento || lista.tema}</CardTitle><p className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatarData(lista.data)}</span><span>{lista.local}</span><span>{lista.empresa}</span></p></div><div className="flex shrink-0 gap-1"><Button variant="outline" onClick={() => setAberta(lista)}><Users className="size-4" /> Abrir</Button>{podeEditarLista(perfil?.id, lista.user_id, adminPrincipal) && <><Button variant="outline" aria-label={`Editar ${lista.nome_treinamento || lista.tema}`} onClick={() => setAberta(lista)}><Pencil className="size-4" /> Editar</Button><ConfirmacaoExclusao nome={`a lista “${lista.nome_treinamento || lista.tema}”`} onConfirmar={async () => { await excluirLista(lista.id); atualizar(); }}><Button variant="ghost" size="icon" aria-label="Excluir lista" className="text-destructive"><Trash2 className="size-4" /></Button></ConfirmacaoExclusao></>}</div></CardHeader></Card>)}</div> : <div className="py-12 text-center text-muted-foreground"><ClipboardList className="mx-auto mb-3 size-10" />Nenhuma lista encontrada com esses filtros.<div><Button variant="outline" className="mt-3" onClick={limparFiltros}>Limpar filtros</Button></div></div>}</>}
  <Dialog open={nova} onOpenChange={setNova}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="break-words pr-6">LISTA DE TREINAMENTO</DialogTitle></DialogHeader><FormularioLista empresaPadrao={perfil?.empresa ?? ""} logo={logo} onSalvo={() => { setNova(false); atualizar(); }} /></DialogContent></Dialog>
  {aberta && <Visualizacao key={aberta.id} inicial={aberta} onFechar={() => setAberta(null)} onAtualizado={atualizar} />}</div>;
}
function Visualizacao({ inicial, onFechar, onAtualizado }: { inicial: ListaPresenca; onFechar: () => void; onAtualizado: () => void }) {
  const qc = useQueryClient();
  const { perfil, adminPrincipal } = usePerfil();
  const [lista, setLista] = useState(inicial);
  const [editando, setEditando] = useState(false);
  const [assinando, setAssinando] = useState<Participante | null>(null);
  const [assinandoInstrutor, setAssinandoInstrutor] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const { data: logo } = useLogoEmpresa(lista.user_id);
  const { data: participantes = [], isLoading, error } = useQuery({ queryKey: ["participantes-lista", lista.id], queryFn: () => listarParticipantes(lista.id) });
  const pode = podeEditarLista(perfil?.id, lista.user_id, adminPrincipal);
  async function modo(m: "digital" | "manual") { setOcupado(true); try { await alterarModoAssinatura(lista.id,m); setLista(l => ({...l,modo_assinatura:m})); onAtualizado(); } catch(e) { toast.error(e instanceof Error ? e.message : "Não foi possível alterar."); } finally { setOcupado(false); } }
  async function exportar(pdf: boolean, branco: boolean) { setOcupado(true); try { await (pdf ? baixarPdfLista : imprimirLista)(lista,participantes,branco,logo); } catch(e) { toast.error(e instanceof Error ? e.message : "Não foi possível exportar."); } finally { setOcupado(false); } }
  return <><Dialog open onOpenChange={v => !v && onFechar()}><DialogContent className="flex max-h-[90vh] w-[calc(100vw-24px)] min-w-0 flex-col overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle className="break-words pr-6">LISTA DE TREINAMENTO</DialogTitle></DialogHeader>
  {editando ? <FormularioLista lista={lista} iniciais={participantes.map(p => ({id:p.id,nome:p.nome,funcao:p.funcao ?? "",employee_id:p.employee_id}))} empresaPadrao={lista.empresa ?? ""} logo={logo} onSalvo={() => { onAtualizado(); onFechar(); }} /> : <div className="min-w-0 space-y-4"><LogoEmpresa url={logo} /><h2 className="break-words text-center font-semibold uppercase">{lista.nome_treinamento || lista.tema}</h2><div className="grid gap-3 border-y py-4 text-sm sm:grid-cols-3">{[["Empresa",lista.empresa],["Local",lista.local],["Data",formatarData(lista.data)],["Horário",lista.horario],["Carga Horária",lista.carga_horaria]].map(([label,value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="break-words font-medium">{value || "—"}</p></div>)}</div><p className="whitespace-pre-wrap text-sm">{lista.tema}</p>
  {pode && <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={isLoading} onClick={() => setEditando(true)}><Pencil className="size-4" /> Editar lista</Button><Button aria-pressed={lista.modo_assinatura === "digital"} variant={lista.modo_assinatura === "digital" ? "default" : "outline"} disabled={ocupado} onClick={() => modo("digital")}>Assinatura Digital</Button><Button aria-pressed={lista.modo_assinatura === "manual"} variant={lista.modo_assinatura === "manual" ? "default" : "outline"} disabled={ocupado} onClick={() => modo("manual")}>Assinatura Manual</Button></div>}
  <div className="overflow-x-auto rounded-md border"><table className="w-full min-w-[540px] text-sm"><thead><tr className="bg-muted text-left"><th className="p-3">Nº</th><th className="p-3">Nome Completo</th><th className="p-3">Função / Cargo</th><th className="w-48 p-3">Assinatura</th></tr></thead><tbody>{error ? <tr><td colSpan={4} className="p-4 text-destructive">{error.message}</td></tr> : isLoading ? <tr><td colSpan={4} className="p-4">Carregando…</td></tr> : participantes.map((p,i) => <tr key={p.id} className="border-t"><td className="p-3">{i+1}</td><td className="p-3 uppercase">{p.nome}</td><td className="p-3 uppercase">{p.funcao}</td><td className="p-2">{lista.modo_assinatura === "digital" && <>{p.assinatura && <img alt={`Assinatura de ${p.nome}`} src={p.assinatura} className="signature-image h-16 w-44 object-contain" />}{pode && <Button variant="outline" size="sm" className="w-full" onClick={() => setAssinando(p)}><PenLine className="size-4" />{p.assinatura ? "Assinar novamente" : "Assinar"}</Button>}</>}</td></tr>)}</tbody></table></div>
  <div id="bloco-instrutor" className="rounded-md border p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Responsável / Instrutor (Quem Ministrou)</p><div className="mt-2 grid gap-3 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Nome do Instrutor / Responsável</p><p className="break-words font-medium uppercase">{lista.instrutor_nome || "—"}</p></div><div><p className="text-xs text-muted-foreground">Cargo / Função</p><p className="break-words font-medium uppercase">{lista.instrutor_cargo || "—"}</p></div></div><div className="mt-3 border-t pt-3"><p className="text-xs text-muted-foreground">Assinatura do Instrutor</p>{lista.instrutor_assinatura && <img alt="Assinatura do instrutor" src={lista.instrutor_assinatura} className="signature-image mt-1 h-16 w-44 object-contain" />}{pode && lista.modo_assinatura === "digital" && <Button variant="outline" size="sm" className={lista.instrutor_assinatura ? "ml-2" : "mt-2"} onClick={() => setAssinandoInstrutor(true)}><PenLine className="size-4" />{lista.instrutor_assinatura ? "Assinar novamente" : "Assinar"}</Button>}{lista.modo_assinatura === "manual" && <p className="mt-1 text-xs text-muted-foreground">Assinatura manual: imprima a folha e colha a assinatura a caneta.</p>}</div></div>
  <div className="grid gap-2 sm:grid-cols-2">{[false,true].map(branco => <div key={String(branco)} className="flex flex-col gap-2"><Button variant="outline" disabled={ocupado || isLoading || !!error} onClick={() => exportar(false,branco)}><Printer className="size-4" />Imprimir — {branco ? "Em Branco" : "Completa"}</Button><Button disabled={ocupado || isLoading || !!error} onClick={() => exportar(true,branco)}><Download className="size-4" />Baixar PDF — {branco ? "Em Branco" : "Completa"}</Button></div>)}</div></div>}
  </DialogContent></Dialog><AssinaturaParticipante participante={assinando} onFechar={() => setAssinando(null)} onSalvo={() => { void qc.invalidateQueries({ queryKey:["participantes-lista",lista.id] }); }} /><DialogoAssinatura open={assinandoInstrutor} titulo="Assinatura do Instrutor" onFechar={() => setAssinandoInstrutor(false)} onSalvar={async imagem => { await salvarAssinaturaInstrutor(lista.id, imagem); setLista(l => ({ ...l, instrutor_assinatura: imagem, instrutor_assinatura_data: new Date().toISOString() })); onAtualizado(); toast.success("Assinatura do instrutor salva."); }} /></>;
}
