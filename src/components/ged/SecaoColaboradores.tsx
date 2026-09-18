import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ListaDocumentos } from "@/components/ged/ListaDocumentos";
import { ModalDocumento } from "@/components/ged/ModalDocumento";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TIPOS_DOC_COLABORADOR,
  excluirColaborador,
  listarColaboradores,
  listarDocumentosColaborador,
  salvarColaborador,
  type Colaborador,
} from "@/lib/ged";

function DocumentosDoColaborador({ colaborador }: { colaborador: Colaborador }) {
  const qc = useQueryClient();
  const chave = ["ged-docs-colaborador", colaborador.id];
  const { data: docs = [] } = useQuery({
    queryKey: chave,
    queryFn: () => listarDocumentosColaborador(colaborador.id),
  });

  return (
    <div className="space-y-3">
      <ModalDocumento
        escopo={{ tipo: "colaborador", employeeId: colaborador.id }}
        tipos={TIPOS_DOC_COLABORADOR}
        rotulo="Anexar documento do colaborador"
        onSalvo={() => qc.invalidateQueries({ queryKey: chave })}
      />
      <ListaDocumentos
        documentos={docs}
        tabela="employee_documents"
        onMudou={() => qc.invalidateQueries({ queryKey: chave })}
        vazio="Sem ASO, treinamentos ou ficha de EPI anexados."
      />
    </div>
  );
}

function NovoColaborador({
  contractorId,
  onSalvo,
}: {
  contractorId: string | null;
  onSalvo: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ name: "", cpf: "", role_title: "" });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Informe o nome do colaborador.");
      await salvarColaborador({
        contractor_id: contractorId,
        name: form.name.trim().slice(0, 120),
        cpf: form.cpf.trim() || null,
        role_title: form.role_title.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success("Colaborador cadastrado");
      setForm({ name: "", cpf: "", role_title: "" });
      setAberto(false);
      onSalvo();
    },
    onError: (e: Error) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-2">
          <UserPlus className="size-4" /> Novo colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar colaborador</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="col-nome">Nome</Label>
            <Input
              id="col-nome"
              className="h-12"
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-cpf">CPF</Label>
            <Input
              id="col-cpf"
              className="h-12"
              maxLength={20}
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-funcao">Função</Label>
            <Input
              id="col-funcao"
              className="h-12"
              maxLength={80}
              placeholder="Ex.: Pedreiro"
              value={form.role_title}
              onChange={(e) => setForm({ ...form, role_title: e.target.value })}
            />
          </div>
          <Button
            type="button"
            className="h-12 w-full"
            disabled={salvar.isPending}
            onClick={() => salvar.mutate()}
          >
            Salvar colaborador
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SecaoColaboradores({
  contractorId,
  busca,
}: {
  contractorId: string | null;
  busca: string;
}) {
  const qc = useQueryClient();
  const chave = ["ged-colaboradores", contractorId];
  const { data: colaboradores = [] } = useQuery({
    queryKey: chave,
    queryFn: () => listarColaboradores(contractorId),
  });

  const remover = useMutation({
    mutationFn: (id: string) => excluirColaborador(id),
    onSuccess: () => {
      toast.success("Colaborador excluído");
      qc.invalidateQueries({ queryKey: chave });
    },
    onError: (e: Error) => toast.error("Não foi possível excluir", { description: e.message }),
  });

  const termo = busca.trim().toLowerCase();
  const lista = termo
    ? colaboradores.filter(
        (c) =>
          c.name.toLowerCase().includes(termo) ||
          (c.cpf ?? "").toLowerCase().includes(termo) ||
          (c.role_title ?? "").toLowerCase().includes(termo),
      )
    : colaboradores;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Documentos dos Colaboradores</CardTitle>
        <NovoColaborador
          contractorId={contractorId}
          onSalvo={() => qc.invalidateQueries({ queryKey: chave })}
        />
      </CardHeader>
      <CardContent>
        {lista.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhum colaborador cadastrado.
          </p>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {lista.map((c) => (
              <AccordionItem key={c.id} value={c.id} className="rounded-xl border px-3">
                <div className="flex items-center gap-2">
                  <AccordionTrigger className="flex-1 text-left">
                    <span>
                      <span className="font-semibold">{c.name}</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {[c.role_title, c.cpf].filter(Boolean).join(" · ") || "Sem função informada"}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Excluir colaborador"
                    onClick={() => {
                      if (confirm(`Excluir ${c.name} e seus documentos?`)) remover.mutate(c.id);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
                <AccordionContent className="pb-4">
                  <DocumentosDoColaborador colaborador={c} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
