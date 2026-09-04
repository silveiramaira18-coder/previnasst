import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OUTROS } from "@/lib/opcoes";
import { cn } from "@/lib/utils";

type Props = {
  opcoes: string[];
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  placeholderOutro?: string;
};

/** Select pesquisável com opção de digitação manual em "Outros". */
export function SelectPesquisavel({
  opcoes,
  value,
  onChange,
  placeholder = "Selecione...",
  placeholderOutro = "Informe manualmente",
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [modoOutro, setModoOutro] = useState(!!value && !opcoes.includes(value));

  return (
    <div className="space-y-2">
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={aberto}
            className="h-12 w-full justify-between whitespace-normal text-left font-normal"
          >
            <span className="min-w-0 flex-1 truncate">
              {modoOutro ? OUTROS : value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Buscar..." />
            <CommandList>
              <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
              <CommandGroup>
                {opcoes.map((op) => (
                  <CommandItem
                    key={op}
                    value={op}
                    onSelect={() => {
                      if (op === OUTROS) {
                        setModoOutro(true);
                        onChange("");
                      } else {
                        setModoOutro(false);
                        onChange(op);
                      }
                      setAberto(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        (modoOutro && op === OUTROS) || (!modoOutro && value === op)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {op}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {modoOutro ? (
        <Input
          className="h-12"
          placeholder={placeholderOutro}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}
