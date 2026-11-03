import { useEffect, useRef, useState } from "react";
import { Eraser, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { salvarAssinatura, type Participante } from "@/lib/presenca";
import type SignaturePad from "signature_pad";

export function AssinaturaParticipante({ participante, onFechar, onSalvo }: { participante: Participante | null; onFechar: () => void; onSalvo: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<SignaturePad | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    if (!participante) return;
    let cancelado = false;
    let observer: ResizeObserver | undefined;
    setPronto(false);
    const timer = window.setTimeout(async () => {
      const { default: SignaturePad } = await import("signature_pad");
      const el = canvas.current;
      if (!el || cancelado) return;
      const styles = getComputedStyle(document.documentElement);
      const instance = new SignaturePad(el, { penColor: styles.getPropertyValue("--paper-ink").trim(), backgroundColor: styles.getPropertyValue("--paper").trim() });
      pad.current = instance;
      const resize = () => {
        const points = instance.toData();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        el.width = el.clientWidth * ratio;
        el.height = el.clientHeight * ratio;
        el.getContext("2d")?.scale(ratio, ratio);
        instance.clear();
        if (points.length) instance.fromData(points);
      };
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(el);
      setPronto(true);
    }, 100);
    return () => { cancelado = true; window.clearTimeout(timer); observer?.disconnect(); pad.current?.off(); pad.current = null; };
  }, [participante]);
  async function salvar() {
    if (!participante || !pad.current || pad.current.isEmpty()) { toast.error("Faça a assinatura antes de confirmar."); return; }
    setSalvando(true);
    try { await salvarAssinatura(participante.id, pad.current.toDataURL("image/png")); onSalvo(); onFechar(); toast.success("Assinatura salva."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setSalvando(false); }
  }
  return <Dialog open={!!participante} onOpenChange={v => !v && onFechar()}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Assinatura — {participante?.nome}</DialogTitle></DialogHeader><canvas ref={canvas} aria-label="Área de assinatura" className="signature-canvas rounded-md border" /><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => pad.current?.clear()} disabled={salvando}><Eraser className="size-4" /> Limpar Assinatura</Button><Button onClick={salvar} disabled={!pronto || salvando}><Check className="size-4" /> {salvando ? "Salvando…" : "Confirmar Assinatura"}</Button></div></DialogContent></Dialog>;
}