// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { useCallback, useMemo } from 'react';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCollection } from '@/features/collection/characters/useCharacterCollection';
import { CharacterPool } from '@/features/teams/CharacterPool';
import { TeamPlanner } from '@/features/teams/TeamPlanner';
import { TEAM_SLOTS, useTeamStore } from '@/features/teams/useTeamStore';

export function TeamsPage() {
  const { characters, getCharacter } = useCollection();

  const teams = useTeamStore((s) => s.teams);
  const selectedSlot = useTeamStore((s) => s.selectedSlot);
  const selectSlot = useTeamStore((s) => s.selectSlot);
  const deselectSlot = useTeamStore((s) => s.deselectSlot);
  const assignCharacter = useTeamStore((s) => s.assignCharacter);
  const removeCharacter = useTeamStore((s) => s.removeCharacter);
  const setTeamName = useTeamStore((s) => s.setTeamName);

  const selectedTeam = selectedSlot !== null ? teams[selectedSlot] : null;

  const assignedIds = useMemo(
    () => new Set(selectedTeam?.members.map((m) => m.characterId) ?? []),
    [selectedTeam?.members],
  );

  const teamFull = (selectedTeam?.members.length ?? 0) >= MAX_TEAM_MEMBERS;

  const handleToggleCharacter = useCallback(
    (characterId: string) => {
      if (selectedSlot === null) return;
      if (assignedIds.has(characterId)) {
        const index = selectedTeam?.members.findIndex((m) => m.characterId === characterId) ?? -1;
        if (index >= 0) removeCharacter(selectedSlot, index);
      } else {
        assignCharacter(selectedSlot, characterId);
      }
    },
    [selectedSlot, assignedIds, selectedTeam?.members, assignCharacter, removeCharacter],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="sr-only">Teams</h1>

      <div className="space-y-4">
        {TEAM_SLOTS.map((slot) => (
          <section key={slot} aria-label={teams[slot].name} className="p-4">
            <TeamPlanner
              slot={slot}
              name={teams[slot].name}
              members={teams[slot].members}
              getCharacter={getCharacter}
              onNameChange={(name) => setTeamName(slot, name)}
              onEdit={() => selectSlot(slot)}
            />
          </section>
        ))}
      </div>

      <Sheet
        open={selectedSlot !== null}
        onOpenChange={(open) => {
          if (!open) deselectSlot();
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto flex w-full max-w-7xl flex-col overflow-y-auto rounded-t-xl top-[124px]"
        >
          {selectedSlot !== null && selectedTeam && (
            <>
              <TeamPlanner
                slot={selectedSlot}
                name={selectedTeam.name}
                members={selectedTeam.members}
                getCharacter={getCharacter}
                onNameChange={(name) => setTeamName(selectedSlot, name)}
              />

              <nav className="mt-4 flex gap-4 border-b border-border">
                <button
                  type="button"
                  className="border-b-2 border-primary px-1 pb-2 text-sm font-semibold text-foreground"
                  aria-current="page"
                >
                  Characters
                </button>
              </nav>

              <div className="mt-3 flex-1">
                <CharacterPool
                  characters={characters}
                  assignedIds={assignedIds}
                  teamFull={teamFull}
                  onAssign={handleToggleCharacter}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
