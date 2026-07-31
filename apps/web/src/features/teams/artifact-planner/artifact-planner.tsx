// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactPlan } from '@genshin/domain';
import {
  ARTIFACT_PIECES,
  CIRCLET_MAIN_AFFIXES,
  GOBLET_MAIN_AFFIXES,
  SANDS_MAIN_AFFIXES,
  type CircletMainAffix,
  type GobletMainAffix,
  type SandsMainAffix,
} from '@genshin/game-data';
import { Shield } from 'lucide-react';
import type { JSX } from 'react';

import { MainAffixSelector } from './main-affix-selector';
import { PrioritySubstats } from './priority-substats';
import { SetConfiguration } from './set-configuration';

interface ArtifactPlannerProps {
  plan?: ArtifactPlan;
  onChange?: (plan: ArtifactPlan) => void;
}

export function ArtifactPlanner({ plan, onChange }: ArtifactPlannerProps): JSX.Element {
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
