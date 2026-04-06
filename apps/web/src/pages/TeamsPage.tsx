// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCollection } from '@/features/collection/characters/useCharacterCollection';
import { CharacterPool } from '@/features/teams/CharacterPool';
import { TeamPlanner } from '@/features/teams/TeamPlanner';
import { TEAM_SLOTS, useTeamStore } from '@/features/teams/useTeamStore';
import { cn } from '@/lib/utils';

export function TeamsPage() {
  const { characters } = useCollection();

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

  const teamRefs = useRef<Record<number, HTMLElement | null>>({});

  useEffect(() => {
    if (selectedSlot !== null) {
      teamRefs.current[selectedSlot]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSlot]);

  return (
    <div
      className={cn(
        'max-w-7xl px-4 py-12 transition-all duration-500',
        selectedSlot !== null ? 'mr-auto sm:max-w-[50vw]' : 'mx-auto',
      )}
    >
      <h1 className="sr-only">Teams</h1>

      <div className="space-y-4">
        {TEAM_SLOTS.map((slot) => (
          <div
            key={slot}
            ref={(el) => {
              teamRefs.current[slot] = el;
            }}
          >
            <TeamPlanner
              slot={slot}
              name={teams[slot].name}
              members={teams[slot].members}
              onSelect={() => selectSlot(slot)}
              onNameChange={(name) => setTeamName(slot, name)}
            />
          </div>
        ))}
      </div>

      <Sheet
        open={selectedSlot !== null}
        onOpenChange={(open) => {
          if (!open) deselectSlot();
        }}
      >
        <SheetContent
          side="right"
          overlayOpacity={10}
          className="flex w-full flex-col overflow-y-auto sm:w-1/2 sm:max-w-none"
        >
          {selectedSlot !== null && selectedTeam && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTeam.name}</SheetTitle>
                <SheetDescription>Click a character to assign or remove them.</SheetDescription>
              </SheetHeader>

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
