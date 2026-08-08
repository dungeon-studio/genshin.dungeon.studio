// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ARTIFACT_SETS, type ArtifactSet } from '@genshin/game-data';
import { Check, ChevronsUpDown, Minus } from 'lucide-react';
import type { JSX } from 'react';
import { useState } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function ArtifactSetSearch({
  label,
  value,
  onChange,
  onClear,
}: {
  label: string;
  value: ArtifactSet['id'] | undefined;
  onChange: (id: ArtifactSet['id']) => void;
  onClear?: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);

  const selectedSet = value ? ARTIFACT_SETS.find((set) => set.id === value) : undefined;

  return (
    <div className="flex gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            // Radix adds `aria-controls` to the `asChild` trigger at runtime.
            // eslint-disable-next-line jsx-a11y-x/role-has-required-aria-props
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-between rounded-md border border-border bg-background px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selectedSet ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <span className="truncate">{selectedSet?.name ?? label}</span>
            <ChevronsUpDown
              className="ml-1 h-3 w-3 shrink-0 opacity-50"
              aria-hidden="true"
              focusable={false}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search artifact set..." className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty className="py-3 text-xs">No sets found.</CommandEmpty>
              <CommandGroup>
                {ARTIFACT_SETS.map((set) => (
                  <CommandItem
                    key={set.id}
                    value={set.name}
                    onSelect={() => {
                      onChange(set.id);
                      setOpen(false);
                    }}
                    className="text-xs"
                  >
                    <Check
                      className={cn('mr-1 h-3 w-3', set.id === value ? 'opacity-100' : 'opacity-0')}
                      aria-hidden="true"
                      focusable={false}
                    />
                    {set.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-md border border-border px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Clear selection"
        >
          <Minus className="h-3 w-3" aria-hidden="true" focusable={false} />
        </button>
      )}
    </div>
  );
}
