// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CollectionCharacter,
  CollectionTeam,
  CollectionWeapon,
  CollectionWeaponId,
} from '@genshin/domain';
import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { getCharacterById } from '@genshin/game-data';

import { elementBorderClass } from '@/lib/element-styles';
import { cn } from '@/lib/utils';

import { TeamMemberSummary } from './team-member-summary';

interface TeamStripProps {
  members: CollectionTeam['members'];
  selectedMemberIndex: number | null;
  onSelect: (memberIndex: number) => void;
  getCharacter: (characterId: string) => CollectionCharacter | undefined;
  getCollectionWeapon: (collectionWeaponId: CollectionWeaponId) => CollectionWeapon | undefined;
}

export function TeamStrip({
  members,
  selectedMemberIndex,
  onSelect,
  getCharacter,
  getCollectionWeapon,
}: TeamStripProps) {
  const slots = Array.from({ length: MAX_TEAM_MEMBERS }, (_, i) => members[i]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {slots.map((member, i) => {
        const character = member ? getCharacterById(member.characterId) : undefined;

        const selected = selectedMemberIndex === i;
        const borderClass = elementBorderClass(character?.element);

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              'rounded-lg border border-border border-l-4 p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              borderClass,
              'cursor-pointer hover:bg-accent/50',
              selected && 'bg-accent/50',
            )}
            aria-label={
              character ? `Select ${character.name}` : `Select empty member position ${i + 1}`
            }
            aria-pressed={selected}
          >
            <TeamMemberSummary
              member={member}
              collectionCharacter={member ? getCharacter(member.characterId) : undefined}
              collectionWeapon={
                member?.weaponInstanceId ? getCollectionWeapon(member.weaponInstanceId) : undefined
              }
            />
          </button>
        );
      })}
    </div>
  );
}
