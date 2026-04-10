// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter, CollectionTeamMember, CollectionWeapon } from '@genshin/domain';
import { getCharacterById, getWeaponById } from '@genshin/game-data';

import { CharacterSummary } from '@/components/CharacterSummary';
import { WeaponSummary } from '@/components/WeaponSummary';

interface TeamMemberSummaryProps {
  member: CollectionTeamMember | null;
  collectionCharacter?: CollectionCharacter;
  collectionWeapon?: CollectionWeapon;
}

export function TeamMemberSummary({
  member,
  collectionCharacter,
  collectionWeapon,
}: TeamMemberSummaryProps) {
  const character = member ? getCharacterById(member.characterId) : undefined;
  const weapon = collectionWeapon ? getWeaponById(collectionWeapon.weaponId) : undefined;

  return (
    <div className="space-y-1.5">
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
    </div>
  );
}
