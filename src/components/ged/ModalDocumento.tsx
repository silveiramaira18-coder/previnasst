import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ComboboxGed } from "@/components/ged/ComboboxGed";
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
  DOCUMENTOS_GERAIS_COLABORADOR,
  TREINAMENTOS_NR,
  anexarDocumento,
} from "@/lib/ged";

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
  const [especificacaoOutro, setEspecificacaoOutro] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const salvar = useMutation({
    mutationFn: async () => {
      const colaborador = escopo.tipo === "colaborador";
      const tituloFinal = colaborador
        ? form.doc_type === "Outros"
          ? especificacaoOutro.trim()
          : form.doc_type
        : form.title.trim();
      if (!form.doc_type) throw new Error("Selecione o tipo de documento.");
      if (!tituloFinal) throw new Error("Informe o título do documento.");
      await anexarDocumento(escopo, {
        doc_type: form.doc_type,
        title: tituloFinal.slice(0, 150),
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
      setEspecificacaoOutro("");
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
            <ComboboxGed
              value={form.doc_type}
              onChange={(doc_type) => {
                setForm({ ...form, doc_type });
                if (doc_type !== "Outros") setEspecificacaoOutro("");
              }}
              placeholder="Selecione o tipo de documento"
              ariaLabel="Tipo de documento"
              busca="Buscar por nome, ASO ou número da NR..."
              grupos={
                escopo.tipo === "colaborador"
                  ? [
                      { titulo: "Documentos gerais", opcoes: DOCUMENTOS_GERAIS_COLABORADOR },
                      { titulo: "Treinamentos e certificados", opcoes: TREINAMENTOS_NR },
                    ]
                  : [{ opcoes: tipos }]
              }
            />
          </div>
          {escopo.tipo === "empresa" ? (
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
          ) : form.doc_type === "Outros" ? (
            <div className="space-y-1.5">
              <Label htmlFor="ged-outro-titulo">Especifique o documento</Label>
              <Input
                id="ged-outro-titulo"
                className="h-12"
                maxLength={150}
                placeholder="Digite o nome do documento"
                value={especificacaoOutro}
                onChange={(e) => setEspecificacaoOutro(e.target.value)}
              />
            </div>
          ) : null}
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
