// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, TeamSlot } from '@genshin/domain';
import type { Character } from '@genshin/game-data';
import { CHARACTERS } from '@genshin/game-data';
import { Lock, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { CharacterSummary } from '@/components/CharacterSummary';
import { Button } from '@/components/ui/button';
import { CharacterFilters } from '@/features/collection/characters/CharacterFilters';
import type { CharacterFilterState } from '@/features/collection/characters/filtering';
import { filterCharacters, initialFilterState } from '@/features/collection/characters/filtering';
import { useTeamStore } from '@/features/teams/useTeamStore';
import { ELEMENT_BORDER_COLORS, ELEMENT_SELECTED_RINGS } from '@/lib/elementStyles';
import { cn } from '@/lib/utils';

function poolFilterState(): CharacterFilterState {
  return { ...initialFilterState(), ownership: 'owned' };
}

interface CharacterPoolProps {
  characters: Record<CharacterId, CollectionCharacter>;
  slot: TeamSlot;
  memberIndex: number;
  onAssign: (characterId: string) => void;
}

export function CharacterPool({ characters, slot, memberIndex, onAssign }: CharacterPoolProps) {
  const members = useTeamStore((s) => s.teams[slot].members);
  const currentMemberCharacterId = members[memberIndex]?.characterId;
  const otherMemberIds = useMemo(
    () =>
      new Set(
        members
          .filter((m, i): m is NonNullable<typeof m> => m !== null && i !== memberIndex)
          .map((m) => m.characterId),
      ),
    [members, memberIndex],
  );
  const [filters, setFilters] = useState<CharacterFilterState>(poolFilterState);

  function handleFilterChange(next: CharacterFilterState) {
    setFilters({ ...next, ownership: 'owned' });
  }

  const ownedIds = useMemo(() => new Set(Object.keys(characters)), [characters]);
  const ownedCount = ownedIds.size;

  const { filteredCharacters, filteredOwnedCount } = useMemo(() => {
    if (ownedIds.size === 0)
      return { filteredCharacters: [] as Character[], filteredOwnedCount: 0 };
    const filtered = filterCharacters(CHARACTERS, filters, ownedIds);
    return {
      filteredCharacters: filtered,
      filteredOwnedCount: filtered.filter((c) => ownedIds.has(c.id)).length,
    };
  }, [filters, ownedIds]);

  if (ownedCount === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
        <Users className="h-10 w-10 text-muted-foreground" aria-hidden="true" focusable={false} />
        <div className="text-center">
          <p className="font-medium">No characters in your collection</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Visit the characters page to add characters to your collection.
          </p>
        </div>
        <Button asChild>
          <Link to="/characters">Go to Characters</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <CharacterFilters
        filters={filters}
        onChange={handleFilterChange}
        filteredCount={filteredCharacters.length}
        totalCount={CHARACTERS.length}
        ownedCount={ownedCount}
        filteredOwnedCount={filteredOwnedCount}
        showOwnership={false}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCharacters.map((character) => {
            const owned = ownedIds.has(character.id);
            const assignedToCurrentMember = character.id === currentMemberCharacterId;
            const assignedToOtherMember = otherMemberIds.has(character.id);
            const clickable = owned && !assignedToOtherMember;

            const entry = characters[character.id];

            return (
              <PoolCharacterCard
                key={character.id}
                character={character}
                constellationLevel={entry?.constellationLevel ?? 0}
                assignedToCurrentMember={assignedToCurrentMember}
                assignedToOtherMember={assignedToOtherMember}
                disabled={!clickable}
                onClick={() => onAssign(character.id)}
              />
            );
          })}
        </div>

        {filteredCharacters.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No characters match your filters.
          </p>
        )}
      </div>
    </div>
  );
}

interface PoolCharacterCardProps {
  character: Character;
  constellationLevel: number;
  assignedToCurrentMember: boolean;
  assignedToOtherMember: boolean;
  disabled: boolean;
  onClick: () => void;
}

function PoolCharacterCard({
  character,
  constellationLevel,
  assignedToCurrentMember,
  assignedToOtherMember,
  disabled,
  onClick,
}: PoolCharacterCardProps) {
  let ariaLabel = `Add ${character.name} to team`;
  if (assignedToCurrentMember) ariaLabel = `Remove ${character.name} from team`;
  else if (assignedToOtherMember) ariaLabel = `${character.name} is assigned to another position`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        ELEMENT_BORDER_COLORS[character.element],
        assignedToCurrentMember && `ring-2 ring-inset ${ELEMENT_SELECTED_RINGS[character.element]}`,
        disabled && 'cursor-not-allowed opacity-40',
        !disabled && 'cursor-pointer hover:bg-accent/50',
      )}
      aria-label={ariaLabel}
      aria-pressed={assignedToCurrentMember}
    >
      <CharacterSummary character={character} dimmed={false} />
      {assignedToOtherMember && (
        <Lock
          className="shrink-0 text-destructive"
          size={14}
          aria-hidden="true"
          focusable={false}
        />
      )}
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">
        C{constellationLevel}
      </span>
    </button>
  );
}
