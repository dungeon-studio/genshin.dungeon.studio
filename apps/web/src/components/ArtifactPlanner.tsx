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
import { GripVertical, Minus, Shield } from 'lucide-react';
import { useRef, useState } from 'react';

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
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSet = value ? ARTIFACT_SETS.find((s) => s.id === value) : undefined;
  const filtered = ARTIFACT_SETS.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (setId: string) => {
    onChange(setId);
    setQuery('');
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
  };

  const handleBlur = () => {
    // Delay to allow click on option
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative flex gap-1">
      <input
        ref={inputRef}
        type="text"
        value={open ? query : (selectedSet?.name ?? '')}
        placeholder={label}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={label}
      />
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
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
          {filtered.map((set) => (
            <li key={set.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(set.id)}
                className={cn(
                  'w-full px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground',
                  set.id === value && 'bg-accent/50 font-medium',
                )}
              >
                {set.name}
              </button>
            </li>
          ))}
        </ul>
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
