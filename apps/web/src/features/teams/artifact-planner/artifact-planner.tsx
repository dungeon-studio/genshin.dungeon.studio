// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactPlan } from '@genshin/domain';
import {
  ARTIFACT_PIECES,
  CIRCLET_MAIN_AFFIXES,
  GOBLET_MAIN_AFFIXES,
  SANDS_MAIN_AFFIXES,
} from '@genshin/game-data';
import { Shield } from 'lucide-react';
import type { JSX } from 'react';

import { MainAffixSelector } from './main-affix-selector';
import { PrioritySubstats } from './priority-substats';
import { SetConfiguration } from './set-configuration';

/** Maximum affixes selectable in each prioritization list; see ArtifactPlan's "0–3" contract. */
const MAX_PRIORITIZED_SUBSTATS = 3;

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
          onChange={(value) => updatePlan({ sands: value })}
        />
        <MainAffixSelector
          label={ARTIFACT_PIECES.GOBLET}
          options={GOBLET_MAIN_AFFIXES}
          value={plan?.goblet}
          onChange={(value) => updatePlan({ goblet: value })}
        />
        <MainAffixSelector
          label={ARTIFACT_PIECES.CIRCLET}
          options={CIRCLET_MAIN_AFFIXES}
          value={plan?.circlet}
          onChange={(value) => updatePlan({ circlet: value })}
        />

        <SetConfiguration sets={plan?.sets} onChange={(sets) => updatePlan({ sets })} />

        <PrioritySubstats
          label="Priority substats"
          selected={plan?.priorityMinorAffixes ?? []}
          excluded={plan?.secondaryMinorAffixes ?? []}
          max={MAX_PRIORITIZED_SUBSTATS}
          onChange={(affixes) => updatePlan({ priorityMinorAffixes: affixes })}
        />
        <PrioritySubstats
          label="Secondary substats"
          selected={plan?.secondaryMinorAffixes ?? []}
          excluded={plan?.priorityMinorAffixes ?? []}
          max={MAX_PRIORITIZED_SUBSTATS}
          onChange={(affixes) => updatePlan({ secondaryMinorAffixes: affixes })}
        />
      </div>
    </div>
  );
}
