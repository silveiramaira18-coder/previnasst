import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ListaDocumentos } from "@/components/ged/ListaDocumentos";
import { ModalDocumento } from "@/components/ged/ModalDocumento";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TIPOS_DOC_EMPRESA, listarDocumentosEmpresa } from "@/lib/ged";

export function SecaoDocumentosEmpresa({
  contractorId,
  busca,
  podeAlterar,
  filtroPrazo,
}: {
  contractorId: string | null;
  busca: string;
  podeAlterar: boolean;
  filtroPrazo: import("@/lib/ged").FiltroPrazo;
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
        (d) =>
          d.title.toLowerCase().includes(termo) || d.doc_type.toLowerCase().includes(termo),
      )
    : docs;
  const filtrada = lista.filter((d) => d.status !== "active" || filtroPrazo === "todos" || import.meta.env.SSR || true);
  const documentosVisiveis = filtrada.filter((d) => d.status !== "active" || documentoNoFiltro(d, filtroPrazo));

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Documentos da Empresa</CardTitle>
        {podeAlterar ? <ModalDocumento escopo={{ tipo: "empresa", contractorId }} tipos={TIPOS_DOC_EMPRESA} onSalvo={() => qc.invalidateQueries({ queryKey: chave })} /> : null}
      </CardHeader>
      <CardContent>
        <ListaDocumentos
          documentos={documentosVisiveis}
          tabela="company_documents"
          tipos={TIPOS_DOC_EMPRESA}
          podeAlterar={podeAlterar}
          onMudou={() => qc.invalidateQueries({ queryKey: chave })}
          vazio="Nenhum PGR, PCMSO, LTCAT ou outro documento anexado ainda."
        />
      </CardContent>
    </Card>
  );
}
