// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ARTIFACT_MINOR_AFFIXES, type ArtifactMinorAffix } from '@genshin/game-data';
import { Minus } from 'lucide-react';
import type { JSX } from 'react';

export function SubstatList({
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
    (affix) => !excluded.includes(affix) && !selected.includes(affix),
  );

  // The game lists substats in a fixed order regardless of how they were
  // acquired, so present and store the selection in that canonical order.
  const orderedSelected = ARTIFACT_MINOR_AFFIXES.filter((affix) => selected.includes(affix));

  const remove = (affix: ArtifactMinorAffix) => {
    onChange(selected.filter((selectedAffix) => selectedAffix !== affix));
  };

  const add = (affix: ArtifactMinorAffix) => {
    if (selected.length >= max) return;
    const next = [...selected, affix];
    onChange(ARTIFACT_MINOR_AFFIXES.filter((candidate) => next.includes(candidate)));
  };

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-card-foreground">{label}</span>

      {orderedSelected.length > 0 && (
        <ul className="space-y-1" aria-label={label}>
          {orderedSelected.map((affix) => (
            <li key={affix} className="gap-1 px-2 py-1 flex items-center rounded-md bg-muted/50">
              <span className="text-xs flex-1 text-card-foreground">{affix}</span>
              <button
                type="button"
                onClick={() => remove(affix)}
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
          className="px-2 py-1.5 text-xs w-full rounded-md border border-dashed border-border bg-background text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
