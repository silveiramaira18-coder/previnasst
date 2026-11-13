import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ComboboxGed } from "@/components/ged/ComboboxGed";
import { adicionarFuncaoPersonalizada, FUNCOES_CONSTRUCAO, listarColaboradores, listarFuncoesPersonalizadas, ordenarAZ, TREINAMENTOS_NR } from "@/lib/ged";
import { listarObras } from "@/lib/db";
import { salvarLista, type ListaPresenca, type NovoParticipante } from "@/lib/presenca";
import { calcularCargaHoraria } from "@/lib/presenca-regras";
import { usePerfil } from "@/lib/perfil";
import { LogoEmpresa } from "./LogoEmpresa";

export function FormularioLista({ lista, iniciais = [], empresaPadrao, logo, onSalvo }: { lista?: ListaPresenca | null; iniciais?: NovoParticipante[]; empresaPadrao: string; logo?: string | null | undefined; onSalvo: () => void }) {
  const qc = useQueryClient();
  const { perfil } = usePerfil();
  const [local, setLocal] = useState(lista?.local ?? "");
  const [data, setData] = useState(lista?.data ?? "");
  const [empresa, setEmpresa] = useState(lista?.empresa ?? empresaPadrao);
  const [inicio, setInicio] = useState(lista?.horario_inicial ?? "");
  const [fim, setFim] = useState(lista?.horario_final ?? "");
  const [carga, setCarga] = useState(lista?.carga_horaria ?? "");
  const [nome, setNome] = useState(lista?.nome_treinamento ?? lista?.tema ?? "");
  const [tema, setTema] = useState(lista?.tema ?? "");
  const [modo, setModo] = useState<"digital" | "manual">(lista?.modo_assinatura ?? "manual");
  const [instrutorNome, setInstrutorNome] = useState(lista?.instrutor_nome ?? "");
  const [instrutorCargo, setInstrutorCargo] = useState(lista?.instrutor_cargo ?? "");
  const [participantes, setParticipantes] = useState<NovoParticipante[]>(iniciais);
  const [manual, setManual] = useState("");
  const [funcao, setFuncao] = useState("");
  const empresaId = lista?.company_id ?? perfil?.company_id;
  const { data: colaboradores = [] } = useQuery({ queryKey: ["colaboradores-presenca", empresaId], enabled: !!empresaId, queryFn: async () => (await listarColaboradores(null)).filter(c => c.company_id === empresaId) });
  const { data: obras = [] } = useQuery({ queryKey: ["obras-presenca", empresaId], enabled: !!empresaId, queryFn: async () => (await listarObras()).filter(o => o.company_id === empresaId).sort((a,b) => ordenarAZ(a.nome,b.nome)) });
  const { data: funcoes = [] } = useQuery({ queryKey: ["funcoes-personalizadas", null], queryFn: () => listarFuncoesPersonalizadas(null) });
  const { data: listas = [] } = useQuery({ queryKey: ["nomes-treinamento", empresaId], queryFn: async () => { const { listarListas } = await import("@/lib/presenca"); return (await listarListas()).filter(l => l.company_id === empresaId); } });
  const opcoes = [...new Set([...TREINAMENTOS_NR.map(n => n.replace(/^Treinamento /, "")), "NR-02 - Inspeção Prévia (revogada)", "NR-27 - Registro Profissional do Técnico de Segurança (revogada)", "DDS - Diálogo Diário de Segurança", "DSS - Diálogo Semanal de Segurança", "Integração de Segurança de Terceiros", "Integração de Segurança", "Reorientação de Segurança", ...listas.map(l => l.nome_treinamento ?? l.tema)])].sort(ordenarAZ);
  const cargos = [...new Set([...FUNCOES_CONSTRUCAO, ...funcoes.map(f => f.name)])].sort(ordenarAZ);
  const salvar = useMutation({ mutationFn: async () => {
    if (!nome.trim()) throw new Error("Informe o nome do treinamento.");
    if (inicio && fim && !calcularCargaHoraria(inicio, fim)) throw new Error("O horário final deve ser igual ou posterior ao inicial.");
    return salvarLista(lista?.id ?? null, { local, data, empresa, horario: inicio && fim ? `${inicio} às ${fim}` : lista?.horario ?? inicio, horario_inicial: inicio, horario_final: fim, carga_horaria: carga, nome_treinamento: nome, tema, modo_assinatura: modo, instrutor_nome: instrutorNome, instrutor_cargo: instrutorCargo }, participantes);
  }, onSuccess: () => { toast.success(lista ? "Lista atualizada." : "Lista criada."); void qc.invalidateQueries({ queryKey: ["nomes-treinamento"] }); onSalvo(); }, onError: (e: Error) => toast.error(e.message) });
  function horario(a: string, b: string) { setInicio(a); setFim(b); if (a && b) setCarga(calcularCargaHoraria(a,b)); }
  async function adicionar() {
    if (!manual.trim()) return;
    try {
      const cargo = funcao.trim().toUpperCase();
      if (cargo && !cargos.some(c => c.toUpperCase() === cargo)) { await adicionarFuncaoPersonalizada(null, cargo); void qc.invalidateQueries({ queryKey: ["funcoes-personalizadas"] }); }
      setParticipantes(p => [...p, { nome: manual.trim().toUpperCase(), funcao: cargo }]); setManual(""); setFuncao("");
    } catch(e) { toast.error(e instanceof Error ? e.message : "Não foi possível adicionar."); }
  }
  return <div className="space-y-5"><LogoEmpresa url={logo} /><div className="grid gap-4 sm:grid-cols-2">
    <div><Label htmlFor="lp-empresa">Empresa</Label><Input id="lp-empresa" value={empresa} onChange={e => setEmpresa(e.target.value)} /></div>
    <div><Label htmlFor="lp-local">Local</Label><Input id="lp-local" list="locais-presenca" value={local} onChange={e => setLocal(e.target.value)} /><datalist id="locais-presenca">{obras.map(o => <option key={o.id} value={o.nome} />)}</datalist></div>
    <div><Label htmlFor="lp-data">Data</Label><Input id="lp-data" type="date" value={data} onChange={e => setData(e.target.value)} /></div>
    <div className="grid grid-cols-2 gap-2"><div><Label htmlFor="lp-inicio">Horário Inicial</Label><Input id="lp-inicio" type="time" value={inicio} onChange={e => horario(e.target.value,fim)} /></div><div><Label htmlFor="lp-fim">Horário Final</Label><Input id="lp-fim" type="time" value={fim} onChange={e => horario(inicio,e.target.value)} /></div></div>
    <div><Label htmlFor="lp-carga">Carga Horária</Label><Input id="lp-carga" value={carga} onChange={e => setCarga(e.target.value)} /></div>
    <div><Label htmlFor="lp-modo">Assinatura</Label><div id="lp-modo" className="flex gap-2"><Button type="button" variant={modo === "digital" ? "default" : "outline"} aria-pressed={modo === "digital"} onClick={() => setModo("digital")}>Digital</Button><Button type="button" variant={modo === "manual" ? "default" : "outline"} aria-pressed={modo === "manual"} onClick={() => setModo("manual")}>Manual</Button></div></div>
  </div><div className="space-y-2"><Label htmlFor="lp-nome">Nome do Treinamento *</Label><ComboboxGed ariaLabel="Selecionar treinamento" value={nome} onChange={setNome} placeholder="Selecionar treinamento" grupos={[{opcoes}]} /><Input id="lp-nome" aria-label="Nome do Treinamento" value={nome} onChange={e => setNome(e.target.value.toUpperCase())} /></div><div><Label htmlFor="lp-tema">Descrição / Tema do Treinamento</Label><Textarea id="lp-tema" value={tema} onChange={e => setTema(e.target.value)} /></div>
  <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">Responsável / Instrutor (Quem Ministrou)</h3><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="lp-instrutor-nome">Nome do Instrutor / Responsável</Label><Input id="lp-instrutor-nome" value={instrutorNome} onChange={e => setInstrutorNome(e.target.value.toUpperCase())} /></div><div className="space-y-2"><Label htmlFor="lp-instrutor-cargo">Cargo / Função</Label><ComboboxGed ariaLabel="Selecionar cargo do instrutor" value={instrutorCargo} onChange={setInstrutorCargo} placeholder="Selecionar cargo" grupos={[{opcoes:cargos}]} /><Input id="lp-instrutor-cargo" value={instrutorCargo} onChange={e => setInstrutorCargo(e.target.value.toUpperCase())} /></div></div><p className="text-xs text-muted-foreground">A assinatura do instrutor é collected na tela da lista: digital no modo Assinatura Digital, ou a caneta na folha impressa em modo Assinatura Manual.</p></section>
  <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">Participantes</h3><div className="max-h-44 overflow-y-auto rounded-md border p-2">{colaboradores.map(c => <label key={c.id} className="flex items-center gap-2 p-2"><Checkbox checked={participantes.some(p => p.employee_id === c.id)} onCheckedChange={v => setParticipantes(p => v === true ? [...p,{nome:c.name,funcao:c.role_title ?? "",employee_id:c.id}] : p.filter(x => x.employee_id !== c.id))} /><span className="min-w-0 break-words uppercase">{c.name}</span><span className="ml-auto text-xs text-muted-foreground">{c.role_title}</span></label>)}</div>
  <div className="grid gap-2 sm:grid-cols-2"><div><Label htmlFor="lp-manual">Nome completo</Label><Input id="lp-manual" value={manual} onChange={e => setManual(e.target.value.toUpperCase())} /></div><div className="space-y-2"><Label htmlFor="lp-funcao">Função / cargo</Label><ComboboxGed ariaLabel="Selecionar função" value={funcao} onChange={setFuncao} placeholder="Selecionar função" grupos={[{opcoes:cargos}]} /><Input id="lp-funcao" value={funcao} onChange={e => setFuncao(e.target.value.toUpperCase())} /></div></div><Button type="button" variant="secondary" onClick={adicionar}><UserPlus className="size-4" /> Adicionar participante</Button>
  <div className="divide-y">{[...participantes].sort((a,b) => ordenarAZ(a.nome,b.nome)).map((p,i) => <div key={p.id ?? `${p.nome}-${i}`} className="flex items-center gap-2 py-2"><span className="min-w-0 flex-1 break-words uppercase">{p.nome}<small className="block text-muted-foreground">{p.funcao}</small></span><Button variant="ghost" size="icon" aria-label={`Remover ${p.nome}`} onClick={() => setParticipantes(atual => atual.filter(x => x !== p))}><X className="size-4" /></Button></div>)}</div></section><Button className="w-full" size="lg" disabled={salvar.isPending} onClick={() => salvar.mutate()}>{salvar.isPending ? "Salvando…" : "Salvar Lista de Presença"}</Button></div>;
}