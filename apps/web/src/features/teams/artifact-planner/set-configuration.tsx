// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactPlan } from '@genshin/domain';
import type { ArtifactSet } from '@genshin/game-data';
import type { JSX } from 'react';

import { ArtifactSetSearch } from './artifact-set-search';

export function SetConfiguration({
  sets,
  onChange,
}: {
  sets: ArtifactPlan['sets'] | undefined;
  onChange: (sets: ArtifactPlan['sets'] | undefined) => void;
}): JSX.Element {
  const handleFirstChange = (setId: ArtifactSet['id']) => {
    if (sets && sets.length === 2) {
      onChange([setId, sets[1]]);
    } else {
      onChange([setId]);
    }
  };

  const handleSecondChange = (setId: ArtifactSet['id']) => {
    if (sets === undefined) return;
    onChange([sets[0], setId]);
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
