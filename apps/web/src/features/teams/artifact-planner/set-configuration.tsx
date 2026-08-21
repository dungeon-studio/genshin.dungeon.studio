// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactPlan } from '@genshin/domain';
import type { ArtifactSet } from '@genshin/game-data';
import type { JSX } from 'react';

import { ArtifactSetSearch } from './artifact-set-search';

type SetFields = Pick<ArtifactPlan, 'primarySetId' | 'secondarySetId'>;

export function SetConfiguration({
  primarySetId,
  secondarySetId,
  onChange,
}: {
  primarySetId: ArtifactPlan['primarySetId'];
  secondarySetId: ArtifactPlan['secondarySetId'];
  onChange: (fields: SetFields) => void;
}): JSX.Element {
  const update = (fields: Partial<SetFields>) => {
    onChange({ primarySetId, secondarySetId, ...fields });
  };

  const handlePrimaryChange = (setId: ArtifactSet['id']) => update({ primarySetId: setId });
  const handleSecondaryChange = (setId: ArtifactSet['id']) => update({ secondarySetId: setId });
  const handleClearSecondary = () => update({ secondarySetId: undefined });

  // A second 2-piece has nothing to pair with once the primary is gone.
  const handleClearPrimary = () => update({ primarySetId: undefined, secondarySetId: undefined });

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-card-foreground">Artifact Sets</span>

      <ArtifactSetSearch
        label="Search artifact set..."
        value={primarySetId}
        onChange={handlePrimaryChange}
        onClear={primarySetId ? handleClearPrimary : undefined}
      />

      {primarySetId && (
        <ArtifactSetSearch
          label="Optional second 2-piece set..."
          value={secondarySetId}
          onChange={handleSecondaryChange}
          onClear={secondarySetId ? handleClearSecondary : undefined}
        />
      )}
    </div>
  );
}
