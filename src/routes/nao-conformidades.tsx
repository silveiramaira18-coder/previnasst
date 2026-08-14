import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ImageIcon, Filter } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { naoConformidades, obras } from "@/lib/mock-data";

export const Route = createFileRoute("/nao-conformidades")({
  head: () => ({
    meta: [
      { title: "Não Conformidades — SafeCheck" },
      {
        name: "description",
        content:
          "Lista de não conformidades de segurança com filtros por obra, severidade, status e período.",
      },
      { property: "og:title", content: "Não Conformidades — SafeCheck" },
      {
        property: "og:description",
        content: "Filtre não conformidades por obra, severidade, status e período.",
      },
    ],
  }),
  component: NCPage,
});

const TODOS = "todos";

function NCPage() {
  const [obra, setObra] = useState(TODOS);
  const [severidade, setSeveridade] = useState(TODOS);
  const [status, setStatus] = useState(TODOS);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const toISO = (br: string) => {
    const [d, m, y] = br.split("/");
    return `${y}-${m}-${d}`;
  };

  const lista = useMemo(
    () =>
      naoConformidades.filter((nc) => {
        if (obra !== TODOS && nc.obra !== obra) return false;
        if (severidade !== TODOS && nc.severidade !== severidade) return false;
        if (status !== TODOS && nc.status !== status) return false;
        const iso = toISO(nc.data);
        if (de && iso < de) return false;
        if (ate && iso > ate) return false;
        return true;
      }),
    [obra, severidade, status, de, ate],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Não Conformidades"
        description="Desvios identificados nas inspeções e seus prazos de tratamento."
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="size-4" /> Filtros
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Obra</Label>
              <Select value={obra} onValueChange={setObra}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas as obras</SelectItem>
                  {obras.map((o) => (
                    <SelectItem key={o.id} value={o.nome}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Severidade</Label>
              <Select value={severidade} onValueChange={setSeveridade}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>
                  {["Baixa", "Média", "Alta", "Crítica"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos</SelectItem>
                  {["Aberta", "Em tratativa", "Atrasada", "Concluída"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="h-11"
                  value={de}
                  onChange={(e) => setDe(e.target.value)}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="date"
                  className="h-11"
                  value={ate}
                  onChange={(e) => setAte(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {lista.length} não conformidade(s) encontrada(s)
      </p>

      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Fotos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((nc) => (
                <TableRow key={nc.id}>
                  <TableCell className="font-medium">{nc.id}</TableCell>
                  <TableCell>{nc.obra}</TableCell>
                  <TableCell>{nc.data}</TableCell>
                  <TableCell>{nc.categoria}</TableCell>
                  <TableCell className="max-w-[280px] text-muted-foreground">
                    {nc.descricao}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={nc.severidade} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={nc.status} />
                  </TableCell>
                  <TableCell>{nc.prazo}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <ImageIcon className="size-4" /> {nc.fotos}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:hidden">
        {lista.map((nc) => (
          <Card key={nc.id}>
            <CardContent className="space-y-2 p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="truncate font-semibold">
                  {nc.id} · {nc.categoria}
                </p>
                <StatusBadge value={nc.severidade} />
              </div>
              <p className="text-sm text-muted-foreground">{nc.descricao}</p>
              <p className="text-sm">{nc.obra}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
                <StatusBadge value={nc.status} />
                <span className="text-muted-foreground">Prazo: {nc.prazo}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ImageIcon className="size-4" /> {nc.fotos}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}