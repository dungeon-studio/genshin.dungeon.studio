// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  ArtifactPlan,
  CollectionCharacter,
  CollectionWeapon,
  TeamMember,
} from '@genshin/domain';
import { getCharacterById, getWeaponById } from '@genshin/game-data';

import { ArtifactPlanner } from '@/components/ArtifactPlanner';
import { CharacterSummary } from '@/components/CharacterSummary';
import { WeaponSummary } from '@/components/WeaponSummary';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ELEMENT_BORDER_COLORS } from '@/lib/elementStyles';
import { cn } from '@/lib/utils';

interface TeamCharacterPlannerProps {
  member: TeamMember;
  collectionCharacter?: CollectionCharacter;
  collectionWeapon?: CollectionWeapon;
  onArtifactPlanChange?: (plan: ArtifactPlan | undefined) => void;
}

export function TeamCharacterPlanner({
  member,
  collectionCharacter,
  collectionWeapon,
  onArtifactPlanChange,
}: TeamCharacterPlannerProps) {
  const character = getCharacterById(member.characterId);
  const weapon = collectionWeapon ? getWeaponById(collectionWeapon.weaponId) : undefined;

  const borderClass = character
    ? ELEMENT_BORDER_COLORS[character.element]
    : 'border-dashed border-muted-foreground/30';

  return (
    <Card className={cn('border-l-4 transition-colors', borderClass)}>
      {/* Row 1: Character */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <CharacterSummary character={character} />

          {collectionCharacter && (
            <span
              className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground"
              aria-label={`Constellation level ${collectionCharacter.constellationLevel}`}
            >
              C{collectionCharacter.constellationLevel}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Row 2: Weapon instance */}
        {weapon && collectionWeapon ? (
          <div className="flex items-center gap-3 rounded-md bg-muted/50 px-2 py-1.5">
            <WeaponSummary weapon={weapon} />
            <span
              className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground"
              aria-label={`Refinement rank ${collectionWeapon.refinementLevel}`}
            >
              R{collectionWeapon.refinementLevel}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-border px-2 py-1.5">
            <WeaponSummary />
          </div>
        )}

        {/* Row 3: Artifact plan (only when character is assigned) */}
        {character && (
          <ArtifactPlanner plan={member.artifactPlan} onChange={onArtifactPlanChange} />
        )}
      </CardContent>
    </Card>
  );
}
