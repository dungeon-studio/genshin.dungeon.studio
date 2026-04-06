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
  const weapon = collectionWeapon ? getWeaponById(collectionWeapon.weaponId) : undefined;

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
      {/* Row 1: Character */}
      <CardHeader className="p-3 pb-1.5">
        {character ? (
          <div className="flex items-center gap-2">
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
        ) : (
          <div className="flex items-center gap-2">
            <CharacterSummary />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-1.5 p-3 pt-0">
        {/* Row 2: Weapon instance */}
        <div className="flex items-center gap-2">
          <WeaponSummary weapon={weapon} />
          {weapon && collectionWeapon && (
            <span
              className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground"
              aria-label={`Refinement rank ${collectionWeapon.refinementLevel}`}
            >
              R{collectionWeapon.refinementLevel}
            </span>
          )}
        </div>

        {/* Row 3: Artifact plan (only when character is assigned) */}
        {character && member && (
          <ArtifactPlanner plan={member.artifactPlan} onChange={onArtifactPlanChange} />
        )}
      </CardContent>
    </Card>
  );
}
