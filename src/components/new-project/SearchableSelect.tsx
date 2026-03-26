"use client";

import { useState } from "react";
import { IconCheck, IconSelector } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Option {
  value: string;
  label: string;
  icon?: string; // emoji or text prefix
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  style?: React.CSSProperties;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  style,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <div style={style}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-11 w-full justify-between rounded-md border px-3.5 type-body font-normal",
              !selected && "text-text-placeholder"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {selected?.icon && (
                <span className="type-body leading-none">{selected.icon}</span>
              )}
              <span>{selected ? selected.label : placeholder}</span>
            </span>
            <IconSelector size={16} stroke={2} className="ml-2 shrink-0 opacity-40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="w-[--radix-popover-trigger-width] p-0"
          onWheel={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>Tidak ditemukan</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <IconCheck
                      size={16}
                      stroke={2}
                      className={cn(
                        "mr-2",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.icon && (
                      <span className="w-6 text-center text-lg leading-none">
                        {option.icon}
                      </span>
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
