import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eraser, PenLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  inspecaoId: string;
  assinatura?: string | null;
  nomeInicial?: string | null;
  cargoInicial?: string | null;
  dataAssinatura?: string | null;
};

/** Bloco de assinatura eletrônica do responsável/inspetor (dedo, caneta ou mouse). */
export function AssinaturaInspecao({
  inspecaoId,
  assinatura,
  nomeInicial,
  cargoInicial,
  dataAssinatura,
}: Props) {
  const qc = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const desenhando = useRef(false);
  const [temTraco, setTemTraco] = useState(false);
  const [nome, setNome] = useState(nomeInicial ?? "");
  const [cargo, setCargo] = useState(cargoInicial ?? "");
  const [reassinar, setReassinar] = useState(!assinatura);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !reassinar) return;
    const escala = window.devicePixelRatio || 1;
    const largura = canvas.clientWidth;
    const altura = 180;
    canvas.width = largura * escala;
    canvas.height = altura * escala;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(escala, escala);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
  }, [reassinar]);

  const ponto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const iniciar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = ponto(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    desenhando.current = true;
    setTemTraco(true);
  };

  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = ponto(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const parar = () => {
    desenhando.current = false;
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTemTraco(false);
  };

  const salvar = useMutation({
    mutationFn: async () => {
      const canvas = canvasRef.current;
      if (!canvas || !temTraco) throw new Error("Assine no quadro antes de confirmar.");
      if (!nome.trim()) throw new Error("Informe o nome de quem está assinando.");

      // Fundo branco para a assinatura aparecer corretamente no PDF.
      const plano = document.createElement("canvas");
      plano.width = canvas.width;
      plano.height = canvas.height;
      const ctx = plano.getContext("2d");
      if (!ctx) throw new Error("Não foi possível processar a assinatura.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, plano.width, plano.height);
      ctx.drawImage(canvas, 0, 0);

      const { error } = await supabase
        .from("inspecoes")
        .update({
          assinatura: plano.toDataURL("image/png"),
          assinatura_nome: nome.trim(),
          assinatura_cargo: cargo.trim() || null,
          assinatura_data: new Date().toISOString(),
        })
        .eq("id", inspecaoId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspecao", inspecaoId] });
      toast.success("Assinatura confirmada");
      setReassinar(false);
    },
    onError: (e: Error) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assinatura do Responsável / Inspetor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assinatura && !reassinar ? (
          <div className="space-y-3">
            <img
              src={assinatura}
              alt="Assinatura do responsável pela inspeção"
              className="w-full max-w-sm rounded-xl border bg-white"
            />
            <p className="text-sm text-muted-foreground">
              {nomeInicial || "—"}
              {cargoInicial ? ` · ${cargoInicial}` : ""}
              {dataAssinatura
                ? ` · assinado em ${new Date(dataAssinatura).toLocaleString("pt-BR")}`
                : ""}
            </p>
            <Button variant="outline" size="lg" className="h-12 gap-2" onClick={() => setReassinar(true)}>
              <PenLine className="size-4" /> Assinar novamente
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ass-nome">Nome de quem assina</Label>
                <Input
                  id="ass-nome"
                  className="h-12"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ass-cargo">Cargo</Label>
                <Input
                  id="ass-cargo"
                  className="h-12"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                />
              </div>
            </div>

            <canvas
              ref={canvasRef}
              className="w-full touch-none rounded-xl border border-dashed bg-white"
              style={{ height: 180 }}
              onPointerDown={iniciar}
              onPointerMove={mover}
              onPointerUp={parar}
              onPointerLeave={parar}
            />
            <p className="text-xs text-muted-foreground">
              Assine acima usando o dedo, a caneta touch ou o mouse.
            </p>

            <div className="grid gap-2 sm:flex">
              <Button variant="outline" size="lg" className="h-12 gap-2" onClick={limpar}>
                <Eraser className="size-4" /> Limpar assinatura
              </Button>
              <Button
                size="lg"
                className="h-12 gap-2"
                disabled={salvar.isPending}
                onClick={() => salvar.mutate()}
              >
                <PenLine className="size-4" /> Confirmar assinatura
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
