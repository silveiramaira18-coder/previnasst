import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { anexarDocumento } from "@/lib/ged";

type Escopo =
  | { tipo: "empresa"; contractorId: string | null }
  | { tipo: "colaborador"; employeeId: string };

export function ModalDocumento({
  escopo,
  tipos,
  onSalvo,
  rotulo = "Anexar Documento",
}: {
  escopo: Escopo;
  tipos: readonly string[];
  onSalvo: () => void;
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    doc_type: tipos[0] ?? "Outros",
    title: "",
    issue_date: "",
    expiration_date: "",
  });
  const [arquivo, setArquivo] = useState<File | null>(null);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Informe o título do documento.");
      await anexarDocumento(escopo, {
        doc_type: form.doc_type,
        title: form.title.trim().slice(0, 150),
        issue_date: form.issue_date || null,
        expiration_date: form.expiration_date || null,
        arquivo,
      });
    },
    onSuccess: () => {
      toast.success("Documento anexado", {
        description: "Versões anteriores do mesmo documento foram arquivadas como obsoletas.",
      });
      setAberto(false);
      setForm({ doc_type: tipos[0] ?? "Outros", title: "", issue_date: "", expiration_date: "" });
      setArquivo(null);
      onSalvo();
    },
    onError: (e: Error) => toast.error("Não foi possível anexar", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="gap-2">
          <Upload className="size-4" /> {rotulo}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rotulo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ged-tipo">Tipo de documento</Label>
            <Select
              value={form.doc_type}
              onValueChange={(v) => setForm({ ...form, doc_type: v })}
            >
              <SelectTrigger id="ged-tipo" className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ged-titulo">Título / nome do documento</Label>
            <Input
              id="ged-titulo"
              className="h-12"
              maxLength={150}
              placeholder="Ex.: PGR 2026 — Obra Central"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ged-emissao">Data de emissão</Label>
              <Input
                id="ged-emissao"
                type="date"
                className="h-12"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ged-validade">Data de validade</Label>
              <Input
                id="ged-validade"
                type="date"
                className="h-12"
                value={form.expiration_date}
                onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ged-arquivo">Arquivo (PDF ou imagem)</Label>
            <Input
              id="ged-arquivo"
              type="file"
              accept="application/pdf,image/*"
              className="h-12 pt-2.5"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            className="h-12 w-full"
            disabled={salvar.isPending}
            onClick={() => salvar.mutate()}
          >
            {salvar.isPending ? "Enviando..." : "Salvar documento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
