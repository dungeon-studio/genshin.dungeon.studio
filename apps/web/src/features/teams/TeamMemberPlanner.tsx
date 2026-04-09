// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  ArtifactPlan,
  CollectionCharacter,
  CollectionWeapon,
  TeamMember,
} from '@genshin/domain';
import { getCharacterById } from '@genshin/game-data';

import { ArtifactPlanner } from '@/components/ArtifactPlanner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ELEMENT_BORDER_COLORS } from '@/lib/elementStyles';
import { cn } from '@/lib/utils';

import { TeamMemberSummary } from './TeamMemberSummary';

interface TeamMemberPlannerProps {
  member?: TeamMember;
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
}: TeamMemberPlannerProps) {
  const character = member ? getCharacterById(member.characterId) : undefined;

  const borderClass = character
    ? ELEMENT_BORDER_COLORS[character.element]
    : 'border-dashed border-muted-foreground/30';

  return (
    <Card
      className={cn(
        'border-l-4 transition-colors',
        borderClass,
        onSelect && 'cursor-pointer',
        selected && 'ring-2 ring-primary',
      )}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      <CardHeader className="p-3 pb-1.5">
        <TeamMemberSummary
          member={member}
          collectionCharacter={collectionCharacter}
          collectionWeapon={collectionWeapon}
        />
      </CardHeader>

      {character && member && (
        <CardContent className="p-3 pt-0">
          <ArtifactPlanner plan={member.artifactPlan} onChange={onArtifactPlanChange} />
        </CardContent>
      )}
    </Card>
  );
}
