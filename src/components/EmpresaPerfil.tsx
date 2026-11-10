import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Building2, Copy, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePerfil } from "@/lib/perfil";
import { convidarEmpresa } from "@/lib/company.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function EmpresaPerfil() {
  const { perfil } = usePerfil();
  const enviar = useServerFn(convidarEmpresa);
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const empresas = useQuery({ queryKey: ["empresas", perfil?.id], enabled: !!perfil, queryFn: async () => {
    const { data, error } = await supabase.from("companies").select("id,name,owner_id").order("name");
    if (error) throw error;
    return data ?? [];
  } });
  const atual = empresas.data?.find(e => e.id === perfil?.company_id);
  const gerencia = perfil?.adminPrincipal || atual?.owner_id === perfil?.id;
  async function trocar(id: string) {
    setOcupado(true);
    const { error } = await supabase.rpc("select_company", { p_company: id });
    if (error) { toast.error(error.message); setOcupado(false); return; }
    // A full document navigation discards all previous tenant query/form state.
    window.location.assign("/perfil");
  }
  async function convidar() {
    setOcupado(true);
    try { const r = await enviar({ data: { email: email.trim().toLowerCase() } }); setUrl(r.url); setAviso(r.aviso); toast.success("Convite criado"); }
    catch(e) { toast.error(e instanceof Error ? e.message : "Não foi possível convidar."); }
    finally { setOcupado(false); }
  }
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="size-5" /> Empresa e convites</CardTitle></CardHeader><CardContent className="space-y-4">
    <div className="space-y-2"><Label>Empresa ativa</Label><Select value={perfil?.company_id ?? ""} disabled={ocupado} onValueChange={trocar}><SelectTrigger className="h-12"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger><SelectContent>{empresas.data?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
    {gerencia && <div className="space-y-3 border-t pt-4"><Label htmlFor="convite-email">E-mail do convidado</Label><div className="flex flex-col gap-2 sm:flex-row"><Input id="convite-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12" /><Button className="h-12" disabled={ocupado || !email} onClick={convidar}><Mail className="size-4" /> Convidar</Button></div>{url && <><div className="flex gap-2"><Input aria-label="Link do convite" value={url} readOnly /><Button variant="outline" size="icon" aria-label="Copiar convite" onClick={async () => { await navigator.clipboard.writeText(url); toast.success("Link copiado"); }}><Copy className="size-4" /></Button></div><p className="text-sm text-muted-foreground">{aviso}</p></>}</div>}
  </CardContent></Card>;
}

export function AceitarConvite({ token }: { token: string }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  async function aceitar() {
    setOcupado(true); setErro("");
    const { error } = await supabase.rpc("accept_company_invitation", { p_token: token });
    if (error) { setErro(error.message); setOcupado(false); return; }
    window.location.assign("/perfil");
  }
  return <div className="space-y-4"><Button size="lg" disabled={ocupado || !/^[a-f0-9]{64}$/.test(token)} onClick={aceitar}><Check className="size-4" /> {ocupado ? "Aceitando…" : "Aceitar convite"}</Button>{erro && <p role="alert" className="text-destructive">{erro}</p>}</div>;
}