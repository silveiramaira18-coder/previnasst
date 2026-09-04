import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARGOS_RESPONSAVEIS } from "@/lib/opcoes";

type Props = { value: string[]; onChange: (valores: string[]) => void };

/** Responsáveis por resolver a NC: nome + cargo, exibidos como tags. */
export function ResponsaveisInput({ value, onChange }: Props) {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState(CARGOS_RESPONSAVEIS[0] ?? "");

  const adicionar = () => {
    const limpo = nome.trim();
    const texto = limpo ? `${limpo} (${cargo})` : cargo;
    if (!texto || value.includes(texto)) return;
    onChange([...value, texto]);
    setNome("");
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Input
          className="h-12"
          placeholder="Nome (opcional)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar();
            }
          }}
        />
        <Select value={cargo} onValueChange={setCargo}>
          <SelectTrigger className="h-12 w-full">
            <SelectValue placeholder="Cargo" />
          </SelectTrigger>
          <SelectContent>
            {CARGOS_RESPONSAVEIS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" className="h-12 gap-1" onClick={adicionar}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 rounded-lg border bg-muted px-2 py-1 text-xs font-medium"
            >
              {r}
              <button
                type="button"
                aria-label={`Remover ${r}`}
                onClick={() => onChange(value.filter((v) => v !== r))}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
