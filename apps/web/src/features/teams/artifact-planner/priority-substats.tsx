// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ARTIFACT_MINOR_AFFIXES, type ArtifactMinorAffix } from '@genshin/game-data';
import { GripVertical, Minus } from 'lucide-react';
import type { JSX } from 'react';

export function PrioritySubstats({
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
}): JSX.Element {
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
