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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type GrupoCombobox = { titulo?: string; opcoes: readonly string[] };

export function ComboboxGed({
  grupos,
  value,
  onChange,
  placeholder,
  busca = "Buscar...",
  ariaLabel,
}: {
  grupos: readonly GrupoCombobox[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  busca?: string;
  ariaLabel?: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={aberto}
          className="h-12 w-full justify-between gap-2 whitespace-normal text-left font-normal"
        >
          <span className={cn("line-clamp-2 min-w-0 flex-1", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={busca} />
          <CommandList className="max-h-72">
            <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
            {grupos.map((grupo, indice) => (
              <CommandGroup key={grupo.titulo ?? indice} heading={grupo.titulo}>
                {grupo.opcoes.map((opcao) => (
                  <CommandItem
                    key={opcao}
                    value={opcao}
                    onSelect={() => {
                      onChange(opcao);
                      setAberto(false);
                    }}
                  >
                    <Check className={cn("size-4", value === opcao ? "opacity-100" : "opacity-0")} />
                    <span className="whitespace-normal">{opcao}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}