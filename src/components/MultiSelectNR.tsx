import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { NORMAS_REGULAMENTADORAS } from "@/lib/itens";
import { cn } from "@/lib/utils";

type Props = { value: string[]; onChange: (valores: string[]) => void };

/** Seleção múltipla de Normas Regulamentadoras, exibida em tags. */
export function MultiSelectNR({ value, onChange }: Props) {
  const [aberto, setAberto] = useState(false);

  const alternar = (nr: string) =>
    onChange(value.includes(nr) ? value.filter((v) => v !== nr) : [...value, nr]);

  return (
    <div className="space-y-2">
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={aberto}
            className="h-12 w-full justify-between font-normal"
          >
            <span className="min-w-0 flex-1 truncate text-left">
              {value.length > 0 ? value.join(", ") : "Selecione as NRs..."}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Buscar por número ou texto..." />
            <CommandList>
              <CommandEmpty>Nenhuma NR encontrada.</CommandEmpty>
              <CommandGroup>
                {NORMAS_REGULAMENTADORAS.map((n) => (
                  <CommandItem
                    key={n.value}
                    value={`${n.value} ${n.label}`}
                    onSelect={() => alternar(n.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value.includes(n.value) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {n.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((nr) => (
            <span
              key={nr}
              className="inline-flex items-center gap-1 rounded-lg border bg-muted px-2 py-1 text-xs font-medium"
            >
              {nr}
              <button
                type="button"
                aria-label={`Remover ${nr}`}
                onClick={() => onChange(value.filter((v) => v !== nr))}
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
