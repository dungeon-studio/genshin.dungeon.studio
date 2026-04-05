// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactPlan } from '@genshin/domain';
import {
  ARTIFACT_MINOR_AFFIXES,
  ARTIFACT_PIECES,
  ARTIFACT_SETS,
  CIRCLET_MAIN_AFFIXES,
  GOBLET_MAIN_AFFIXES,
  SANDS_MAIN_AFFIXES,
  type ArtifactMinorAffix,
  type ArtifactSet,
  type CircletMainAffix,
  type GobletMainAffix,
  type SandsMainAffix,
} from '@genshin/game-data';
import { Check, ChevronsUpDown, GripVertical, Minus, Shield } from 'lucide-react';
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

interface ArtifactPlannerProps {
  plan?: ArtifactPlan;
  onChange?: (plan: ArtifactPlan) => void;
}

export function ArtifactPlanner({ plan, onChange }: ArtifactPlannerProps) {
  const updatePlan = (fields: ArtifactPlan) => {
    onChange?.({ ...plan, ...fields });
  };

  return (
    <div className="space-y-3">
      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Shield className="h-4 w-4" aria-hidden="true" focusable={false} />
        Artifact Plan
      </span>

      <div className="space-y-4">
        <MainAffixSelector
          label={ARTIFACT_PIECES.SANDS}
          options={SANDS_MAIN_AFFIXES}
          value={plan?.sands}
          onChange={(value) => updatePlan({ sands: value as SandsMainAffix | undefined })}
        />
        <MainAffixSelector
          label={ARTIFACT_PIECES.GOBLET}
          options={GOBLET_MAIN_AFFIXES}
          value={plan?.goblet}
          onChange={(value) => updatePlan({ goblet: value as GobletMainAffix | undefined })}
        />
        <MainAffixSelector
          label={ARTIFACT_PIECES.CIRCLET}
          options={CIRCLET_MAIN_AFFIXES}
          value={plan?.circlet}
          onChange={(value) => updatePlan({ circlet: value as CircletMainAffix | undefined })}
        />

        <SetConfiguration sets={plan?.sets} onChange={(sets) => updatePlan({ sets })} />

        <PrioritySubstats
          label="Priority substats"
          selected={plan?.priorityMinorAffixes ?? []}
          excluded={plan?.secondaryMinorAffixes ?? []}
          max={3}
          onChange={(affixes) => updatePlan({ priorityMinorAffixes: affixes })}
        />
        <PrioritySubstats
          label="Secondary substats"
          selected={plan?.secondaryMinorAffixes ?? []}
          excluded={plan?.priorityMinorAffixes ?? []}
          max={3}
          onChange={(affixes) => updatePlan({ secondaryMinorAffixes: affixes })}
        />
      </div>
    </div>
  );
}

function MainAffixSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-card-foreground">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Select main stat...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SetConfiguration({
  sets,
  onChange,
}: {
  sets: ArtifactPlan['sets'] | undefined;
  onChange: (sets: ArtifactPlan['sets'] | undefined) => void;
}) {
  const handleFirstChange = (setId: ArtifactSet['id']) => {
    if (sets && sets.length === 2) {
      onChange([setId, sets[1]]);
    } else {
      onChange([setId]);
    }
  };

  const handleSecondChange = (setId: ArtifactSet['id']) => {
    onChange([sets![0], setId]);
  };

  const handleClearSecond = () => {
    if (sets) {
      onChange([sets[0]]);
    }
  };

  const handleClearFirst = () => {
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-card-foreground">Artifact Sets</span>

      <ArtifactSetSearch
        label="Search artifact set..."
        value={sets?.[0]}
        onChange={handleFirstChange}
        onClear={sets?.[0] ? handleClearFirst : undefined}
      />

      {sets && sets.length >= 1 && (
        <ArtifactSetSearch
          label="Optional second 2-piece set..."
          value={sets?.[1]}
          onChange={handleSecondChange}
          onClear={sets?.[1] ? handleClearSecond : undefined}
        />
      )}
    </div>
  );
}

function ArtifactSetSearch({
  label,
  value,
  onChange,
  onClear,
}: {
  label: string;
  value: string | undefined;
  onChange: (id: string) => void;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedSet = value ? ARTIFACT_SETS.find((s) => s.id === value) : undefined;

  return (
    <div className="flex gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
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

function PrioritySubstats({
  label,
  selected,
  excluded,
  max,
  onChange,
}: {
  label: string;
  selected: ArtifactMinorAffix[];
  excluded: ArtifactMinorAffix[];
  max: number;
  onChange: (affixes: ArtifactMinorAffix[]) => void;
}) {
  const availableAffixes = ARTIFACT_MINOR_AFFIXES.filter(
    (a) => !excluded.includes(a) && !selected.includes(a),
  );

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...selected];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next as ArtifactMinorAffix[]);
  };

  const remove = (index: number) => {
    onChange(selected.filter((_, i) => i !== index));
  };

  const add = (affix: ArtifactMinorAffix) => {
    if (selected.length >= max) return;
    onChange([...selected, affix]);
  };

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-card-foreground">{label}</span>

      {selected.length > 0 && (
        <ul className="space-y-1" aria-label={label}>
          {selected.map((affix, index) => (
            <li key={affix} className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
              <span className="flex flex-col" aria-label={`Reorder ${affix}`}>
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label={`Move ${affix} up`}
                >
                  <GripVertical
                    className="h-3 w-3 rotate-90"
                    aria-hidden="true"
                    focusable={false}
                  />
                </button>
              </span>
              <span className="flex-1 text-xs text-card-foreground">
                {index + 1}. {affix}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${affix}`}
              >
                <Minus className="h-3 w-3" aria-hidden="true" focusable={false} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length < max && availableAffixes.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              add(e.target.value as ArtifactMinorAffix);
              e.target.value = '';
            }
          }}
          className="w-full rounded-md border border-dashed border-border bg-background px-2 py-1.5 text-xs text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <option value="">
            Add substat ({selected.length}/{max})...
          </option>
          {availableAffixes.map((affix) => (
            <option key={affix} value={affix}>
              {affix}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
