import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET, urlAssinada } from "@/lib/fotos";
import { usePerfil } from "@/lib/perfil";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function useLogoEmpresa(owner?: string) {
  const { perfil } = usePerfil();
  return useQuery({ queryKey: ["logo-empresa", owner ?? perfil?.id, perfil?.empresa_logo], enabled: !!(owner ?? perfil?.id), queryFn: async () => {
    const { data, error } = await supabase.from("profiles").select("empresa_logo").eq("id", owner ?? perfil?.id ?? "").maybeSingle();
    if (error) throw error;
    return data?.empresa_logo ? urlAssinada(data.empresa_logo) : null;
  } });
}

export function LogoEmpresa({ url }: { url?: string | null }) { return url ? <img src={url} alt="Logotipo da empresa" className="mx-auto mb-4 h-20 max-w-56 object-contain" /> : null; }

export function CadastroLogo({ onSalvo }: { onSalvo: () => void }) {
  const { perfil } = usePerfil();
  const input = useRef<HTMLInputElement>(null);
  const [salvando, setSalvando] = useState(false);
  async function upload(file: File) {
    if (!perfil) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error("Selecione uma imagem PNG, JPG ou WebP de até 5 MB."); return; }
    setSalvando(true);
    const caminho = `${perfil.id}/empresa/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(caminho, file);
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("profiles").update({ empresa_logo: caminho }).eq("id", perfil.id);
      if (error) { await supabase.storage.from(BUCKET).remove([caminho]); throw error; }
      onSalvo(); toast.success("Logotipo da empresa atualizado.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível enviar o logotipo."); }
    finally { setSalvando(false); }
  }
  return <><Button variant="outline" disabled={salvando || !perfil} onClick={() => input.current?.click()}><ImagePlus className="size-4" /> {salvando ? "Enviando…" : "Logotipo da empresa"}</Button><input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ""; }} /></>;
}