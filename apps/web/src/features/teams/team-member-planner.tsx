// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  ArtifactPlan,
  CollectionCharacter,
  CollectionTeamMember,
  CollectionWeapon,
} from '@genshin/domain';
import { getCharacterById } from '@genshin/game-data';
import type { JSX } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { elementBorderClass } from '@/lib/element-styles';
import { cn } from '@/lib/utils';

import { ArtifactPlanner } from './artifact-planner';
import { TeamMemberSummary } from './team-member-summary';

interface TeamMemberPlannerProps {
  member: CollectionTeamMember | null;
  collectionCharacter?: CollectionCharacter;
  collectionWeapon?: CollectionWeapon;
  selected?: boolean;
  onSelect?: () => void;
  onArtifactPlanChange?: (plan: ArtifactPlan | undefined) => void;
}

export function TeamMemberPlanner({
  member,
  collectionCharacter,
  collectionWeapon,
  selected = false,
  onSelect,
  onArtifactPlanChange,
}: TeamMemberPlannerProps): JSX.Element {
  const character = member ? getCharacterById(member.characterId) : undefined;

  const borderClass = elementBorderClass(character?.element);

  const summary = (
    <TeamMemberSummary
      member={member}
      collectionCharacter={collectionCharacter}
      collectionWeapon={collectionWeapon}
    />
  );

  return (
    <Card
      className={cn('border-l-4 transition-colors', borderClass, selected && 'ring-2 ring-primary')}
    >
      <CardHeader className="p-3 pb-1.5">
        {/* Only the header selects: the artifact planner's controls sit outside
            it so their clicks and keypresses never reach onSelect. */}
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className="w-full cursor-pointer rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {summary}
          </button>
        ) : (
          summary
        )}
      </CardHeader>

      {character && member && (
        <CardContent className="p-3 pt-0">
          <ArtifactPlanner plan={member.artifactPlan} onChange={onArtifactPlanChange} />
        </CardContent>
      )}
    </Card>
  );
}
