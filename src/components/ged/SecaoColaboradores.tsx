import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ListaDocumentos } from "@/components/ged/ListaDocumentos";
import { ModalDocumento } from "@/components/ged/ModalDocumento";
import { ComboboxGed } from "@/components/ged/ComboboxGed";
import { ImportarColaboradores } from "@/components/ged/ImportarColaboradores";
import { ConfirmacaoExclusao } from "@/components/ged/ConfirmacaoExclusao";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { usePerfil } from "@/lib/perfil";
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
  FUNCOES_CONSTRUCAO,
  adicionarFuncaoPersonalizada,
  cpfValido,
  excluirColaborador,
  formatarCpf,
  listarColaboradores,
  listarDocumentosColaborador,
  listarFuncoesPersonalizadas,
  salvarColaborador,
  documentoNoFiltro,
  type FiltroPrazo,
  type Colaborador,
} from "@/lib/ged";

function DocumentosDoColaborador({ colaborador, podeAlterar, filtroPrazo }: { colaborador: Colaborador; podeAlterar: boolean; filtroPrazo: FiltroPrazo }) {
  const qc = useQueryClient();
  const chave = ["ged-docs-colaborador", colaborador.id];
  const { data: docs = [] } = useQuery({
    queryKey: chave,
    queryFn: () => listarDocumentosColaborador(colaborador.id),
  });
  const atualizar = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: chave }),
      qc.invalidateQueries({ queryKey: ["ged-resumo"] }),
    ]);
  };

  return (
    <div className="space-y-3">
      {podeAlterar ? <ModalDocumento
        escopo={{ tipo: "colaborador", employeeId: colaborador.id }}
        tipos={TIPOS_DOC_COLABORADOR}
        rotulo="Anexar documento do colaborador"
        onSalvo={atualizar}
      /> : null}
      <ListaDocumentos
        documentos={docs.filter((d) => d.status !== "active" || documentoNoFiltro(d, filtroPrazo))}
        tabela="employee_documents"
        tipos={TIPOS_DOC_COLABORADOR}
        podeAlterar={podeAlterar}
        onMudou={atualizar}
        vazio="Sem ASO, treinamentos ou ficha de EPI anexados."
        entidade={colaborador.name}

      />
    </div>
  );
}

function NovoColaborador({
  contractorId,
  onSalvo,
  colaborador,
}: {
  contractorId: string | null;
  onSalvo: () => void;
  colaborador?: Colaborador;
}) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ name: colaborador?.name ?? "", cpf: colaborador?.cpf ?? "", role_title: colaborador?.role_title ?? "" });
  const [modoFuncao, setModoFuncao] = useState<"lista" | "outra" | "nova">("lista");
  const [funcaoManual, setFuncaoManual] = useState("");
  const qc = useQueryClient();
  const chaveFuncoes = ["ged-funcoes", contractorId];
  const { data: funcoesPersonalizadas = [] } = useQuery({
    queryKey: chaveFuncoes,
    queryFn: () => listarFuncoesPersonalizadas(contractorId),
    enabled: aberto,
  });

  const adicionarFuncao = useMutation({
    mutationFn: () => adicionarFuncaoPersonalizada(contractorId, funcaoManual),
    onSuccess: async (nome) => {
      await qc.invalidateQueries({ queryKey: chaveFuncoes });
      setForm({ ...form, role_title: nome });
      setFuncaoManual("");
      setModoFuncao("lista");
      toast.success("Função adicionada à lista");
    },
    onError: (e: Error) => toast.error("Não foi possível adicionar", { description: e.message }),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Informe o nome do colaborador.");
      if (form.cpf && !cpfValido(form.cpf)) throw new Error("Informe um CPF válido.");
      const funcaoFinal = modoFuncao === "lista" ? form.role_title.trim() : funcaoManual.trim();
      if (!funcaoFinal) throw new Error("Selecione ou informe a função.");
      await salvarColaborador({
        ...(colaborador ? { id: colaborador.id } : {}),
        contractor_id: contractorId,
        name: form.name.trim().slice(0, 120),
        cpf: form.cpf.trim() || null,
        role_title: funcaoFinal.slice(0, 80),
      });
    },
    onSuccess: () => {
      toast.success(colaborador ? "Colaborador atualizado" : "Colaborador cadastrado");
      setForm({ name: "", cpf: "", role_title: "" });
      setFuncaoManual("");
      setModoFuncao("lista");
      setAberto(false);
      onSalvo();
    },
    onError: (e: Error) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {colaborador ? (
          <Button type="button" size="icon" variant="ghost" aria-label={`Editar ${colaborador.name}`}><Pencil className="size-4" /></Button>
        ) : (
          <Button type="button" size="sm" variant="outline" className="gap-2"><UserPlus className="size-4" /> Novo colaborador</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{colaborador ? "Editar colaborador" : "Cadastrar colaborador"}</DialogTitle>
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
              inputMode="numeric"
              maxLength={14}
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: formatarCpf(e.target.value) })}
              aria-invalid={Boolean(form.cpf && form.cpf.length === 14 && !cpfValido(form.cpf))}
            />
            {form.cpf && form.cpf.length === 14 && !cpfValido(form.cpf) ? (
              <p className="text-xs text-destructive">CPF inválido. Confira os números digitados.</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-funcao">Função</Label>
            <ComboboxGed
              grupos={[
                { titulo: "Construção Civil / SST", opcoes: FUNCOES_CONSTRUCAO },
                { titulo: "Funções salvas", opcoes: funcoesPersonalizadas.map((f) => f.name) },
                { opcoes: ["Outra (digitar manualmente)", "+ Adicionar nova função à lista"] },
              ]}
              value={modoFuncao === "lista" ? form.role_title : modoFuncao === "outra" ? "Outra (digitar manualmente)" : "+ Adicionar nova função à lista"}
              onChange={(valor) => {
                if (valor === "Outra (digitar manualmente)") {
                  setModoFuncao("outra");
                  setForm({ ...form, role_title: "" });
                } else if (valor === "+ Adicionar nova função à lista") {
                  setModoFuncao("nova");
                  setForm({ ...form, role_title: "" });
                } else {
                  setModoFuncao("lista");
                  setFuncaoManual("");
                  setForm({ ...form, role_title: valor });
                }
              }}
              placeholder="Selecione ou busque uma função"
              ariaLabel="Função"
              busca="Buscar função..."
            />
            {modoFuncao !== "lista" ? (
              <div className="space-y-2 pt-1">
                <Label htmlFor="col-funcao-manual">
                  {modoFuncao === "nova" ? "Nova função" : "Especifique a função"}
                </Label>
                <Input
                  id="col-funcao-manual"
                  className="h-12"
                  maxLength={80}
                  placeholder="Ex.: Técnico de edificações"
                  value={funcaoManual}
                  onChange={(e) => setFuncaoManual(e.target.value)}
                />
                {modoFuncao === "nova" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={adicionarFuncao.isPending || funcaoManual.trim().length < 2}
                    onClick={() => adicionarFuncao.mutate()}
                  >
                    <Plus className="size-4" /> Adicionar à lista
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          <Button
            type="button"
            className="h-12 w-full"
            disabled={salvar.isPending || adicionarFuncao.isPending || Boolean(form.cpf && !cpfValido(form.cpf))}
            onClick={() => salvar.mutate()}
          >
            {colaborador ? "Salvar alterações" : "Salvar colaborador"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SecaoColaboradores({
  contractorId,
  busca,
  podeAlterar,
  filtroPrazo,
}: {
  contractorId: string | null;
  busca: string;
  podeAlterar: boolean;
  filtroPrazo: FiltroPrazo;
}) {
  const qc = useQueryClient();
  const { perfil, adminPrincipal } = usePerfil();
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
        {podeAlterar ? (
          <div className="flex flex-wrap gap-2">
            <ImportarColaboradores
              contractorId={contractorId}
              onImportado={() => qc.invalidateQueries({ queryKey: chave })}
            />
            <NovoColaborador
              contractorId={contractorId}
              onSalvo={() => qc.invalidateQueries({ queryKey: chave })}
            />
          </div>
        ) : null}
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
                   {podeAlterar && (adminPrincipal || (!!perfil?.id && perfil.id === c.user_id)) ? <>
                     <NovoColaborador contractorId={contractorId} colaborador={c} onSalvo={() => qc.invalidateQueries({ queryKey: chave })} />
                     <ConfirmacaoExclusao nome={`“${c.name}” e seus documentos`} onConfirmar={() => remover.mutateAsync(c.id)} disabled={remover.isPending}>
                       <Button type="button" size="icon" variant="ghost" aria-label={`Excluir ${c.name}`}><Trash2 className="size-4 text-destructive" /></Button>
                     </ConfirmacaoExclusao>
                   </> : null}
                </div>
                <AccordionContent className="pb-4">
                   <DocumentosDoColaborador colaborador={c} podeAlterar={podeAlterar} filtroPrazo={filtroPrazo} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
