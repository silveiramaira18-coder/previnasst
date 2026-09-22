import { useQueryClient } from "@tanstack/react-query";
import { Building2, Truck } from "lucide-react";

import { AcoesDocumento } from "@/components/ged/ListaDocumentos";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatarData } from "@/lib/db";
import {
  rotuloContagemValidade,
  TIPOS_DOC_COLABORADOR,
  TIPOS_DOC_EMPRESA,
  type DocumentoAlerta,
  type FiltroPrazo,
} from "@/lib/ged";
import { cn } from "@/lib/utils";

const tons = {
  valido: "bg-success/15 text-success border-success/30",
  atencao: "bg-warning/15 text-warning-foreground border-warning/40",
  vencido: "bg-destructive/15 text-destructive border-destructive/30",
  "sem-validade": "bg-muted text-muted-foreground border-border",
};

function BadgeContagem({ validade }: { validade: string | null }) {
  const contagem = rotuloContagemValidade(validade);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tons[contagem.tom],
      )}
    >
      {contagem.texto}
    </span>
  );
}

function mensagemVazio(filtro: FiltroPrazo) {
  if (filtro === "vencidos") return "Nenhum documento vencido no momento.";
  if (filtro === "7") return "Nenhum documento vence nos próximos 7 dias.";
  if (filtro === "15") return "Nenhum documento vence nos próximos 15 dias.";
  if (filtro === "30") return "Nenhum documento vence nos próximos 30 dias.";
  return "Nenhum documento ativo encontrado.";
}

function CardAlerta({
  item,
  podeAlterar,
  onMudou,
}: {
  item: DocumentoAlerta;
  podeAlterar: boolean;
  onMudou: () => void | Promise<void>;
}) {
  const origem =
    item.origem === "empresa"
      ? "Documento da Empresa"
      : `Documento do Colaborador: ${item.colaboradorNome ?? "Sem nome"}`;
  const tipos = item.origem === "empresa" ? TIPOS_DOC_EMPRESA : TIPOS_DOC_COLABORADOR;

  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 space-y-1">
        <h4 className="font-semibold leading-snug">{item.documento.title}</h4>
        <p className="text-sm text-muted-foreground">{origem}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {item.documento.expiration_date
              ? `Validade ${formatarData(item.documento.expiration_date)}`
              : "Sem data de validade"}
          </span>
          <BadgeContagem validade={item.documento.expiration_date} />
        </div>
      </div>
      <AcoesDocumento
        doc={item.documento}
        tabela={item.tabela}
        tipos={tipos}
        podeAlterar={podeAlterar}
        onMudou={onMudou}
      />
    </article>
  );
}

export function PainelAlertas({
  grupos,
  filtro,
  carregando,
  erro,
  onRecarregar,
  podeAlterar,
}: {
  grupos: { chave: string; rotulo: string; itens: DocumentoAlerta[] }[];
  filtro: FiltroPrazo;
  carregando: boolean;
  erro: boolean;
  onRecarregar: () => void;
  podeAlterar: boolean;
}) {
  const qc = useQueryClient();
  const total = grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  const atualizar = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["ged-alertas"] }),
      qc.invalidateQueries({ queryKey: ["ged-docs-empresa"] }),
      qc.invalidateQueries({ queryKey: ["ged-docs-colaborador"] }),
    ]);
  };

  if (carregando) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">
          Não foi possível carregar os alertas de validade.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRecarregar}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "documento" : "documentos"} neste filtro, agrupados por empresa e
        ordenados pelo vencimento.
      </p>
      {grupos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          {mensagemVazio(filtro)}
        </p>
      ) : (
        <div className="max-h-[32rem] space-y-5 overflow-y-auto pr-1">
          {grupos.map((grupo) => {
            const Icone = grupo.chave === "propria" ? Building2 : Truck;
            return (
              <section key={grupo.chave} className="space-y-2" aria-label={grupo.rotulo}>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Icone className="size-4 text-muted-foreground" />
                  <span className="min-w-0 truncate">{grupo.rotulo}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {grupo.itens.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {grupo.itens.map((item) => (
                    <CardAlerta
                      key={`${item.tabela}-${item.documento.id}`}
                      item={item}
                      podeAlterar={podeAlterar}
                      onMudou={atualizar}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
