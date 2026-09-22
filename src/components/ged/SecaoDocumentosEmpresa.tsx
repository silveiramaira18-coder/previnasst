import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ListaDocumentos } from "@/components/ged/ListaDocumentos";
import { ModalDocumento } from "@/components/ged/ModalDocumento";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TIPOS_DOC_EMPRESA, listarDocumentosEmpresa } from "@/lib/ged";

export function SecaoDocumentosEmpresa({
  contractorId,
  busca,
  podeAlterar,
}: {
  contractorId: string | null;
  busca: string;
  podeAlterar: boolean;
}) {
  const qc = useQueryClient();
  const chave = ["ged-docs-empresa", contractorId];
  const { data: docs = [] } = useQuery({
    queryKey: chave,
    queryFn: () => listarDocumentosEmpresa(contractorId),
  });

  const termo = busca.trim().toLowerCase();
  const lista = termo
    ? docs.filter(
        (d) => d.title.toLowerCase().includes(termo) || d.doc_type.toLowerCase().includes(termo),
      )
    : docs;
  const atualizar = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: chave }),
      qc.invalidateQueries({ queryKey: ["ged-alertas"] }),
    ]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Documentos da Empresa</CardTitle>
        {podeAlterar ? (
          <ModalDocumento
            escopo={{ tipo: "empresa", contractorId }}
            tipos={TIPOS_DOC_EMPRESA}
            onSalvo={atualizar}
          />
        ) : null}
      </CardHeader>
      <CardContent>
        <ListaDocumentos
          documentos={lista}
          tabela="company_documents"
          tipos={TIPOS_DOC_EMPRESA}
          podeAlterar={podeAlterar}
          onMudou={atualizar}
          vazio="Nenhum PGR, PCMSO, LTCAT ou outro documento anexado ainda."
        />
      </CardContent>
    </Card>
  );
}
