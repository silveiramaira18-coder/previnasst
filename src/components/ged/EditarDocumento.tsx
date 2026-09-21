import { useMutation } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ComboboxGed } from "@/components/ged/ComboboxGed";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { atualizarDocumento, type Documento } from "@/lib/ged";

type Tabela = "company_documents" | "employee_documents";

export function EditarDocumento({ doc, tabela, tipos, onSalvo }: { doc: Documento; tabela: Tabela; tipos: readonly string[]; onSalvo: () => void | Promise<void> }) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ title: doc.title, doc_type: doc.doc_type, issue_date: doc.issue_date ?? "", expiration_date: doc.expiration_date ?? "" });
  const salvar = useMutation({
    mutationFn: () => atualizarDocumento(tabela, doc.id, { ...form, issue_date: form.issue_date || null, expiration_date: form.expiration_date || null }),
    onSuccess: async () => {
      await onSalvo();
      toast.success("Dados do documento atualizados");
      setAberto(false);
    },
    onError: (e: Error) => toast.error("Não foi possível atualizar", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild><Button type="button" size="icon" variant="ghost" aria-label="Editar dados"><Pencil className="size-4" /></Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Editar dados do documento</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor={`editar-titulo-${doc.id}`}>Título</Label><Input id={`editar-titulo-${doc.id}`} className="h-12" maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Tipo de documento</Label><ComboboxGed value={form.doc_type} onChange={(doc_type) => setForm({ ...form, doc_type })} grupos={[{ opcoes: tipos }]} placeholder="Selecione o tipo" ariaLabel="Tipo de documento" busca="Buscar tipo..." /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor={`editar-emissao-${doc.id}`}>Data de emissão</Label><Input id={`editar-emissao-${doc.id}`} type="date" className="h-12" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor={`editar-validade-${doc.id}`}>Data de validade</Label><Input id={`editar-validade-${doc.id}`} type="date" className="h-12" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter><Button type="button" className="h-12 w-full" disabled={salvar.isPending || !form.title.trim() || !form.doc_type} onClick={() => salvar.mutate()}>{salvar.isPending ? "Salvando..." : "Salvar alterações"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}