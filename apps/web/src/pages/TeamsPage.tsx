// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId, TeamSlot } from '@genshin/domain';
import { TEAM_SLOTS } from '@genshin/domain';
import { getCharacterById } from '@genshin/game-data';
import { useCallback, useMemo, useState } from 'react';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCollection } from '@/features/collection/characters/useCharacterCollection';
import { useWeaponCollection } from '@/features/collection/weapons/useWeaponCollection';
import { CharacterPool } from '@/features/teams/CharacterPool';
import { TeamPlanner } from '@/features/teams/TeamPlanner';
import { TeamStrip } from '@/features/teams/TeamStrip';
import { WeaponPool } from '@/features/teams/WeaponPool';
import { useTeams } from '@/features/teams/useTeams';

type SheetTab = 'characters' | 'weapons';

export function TeamsPage() {
  const { characters, getCharacter } = useCollection();
  const { weapons } = useWeaponCollection();

  const collectionWeapons = useMemo(() => Object.values(weapons), [weapons]);

  const getCollectionWeapon = useCallback(
    (collectionWeaponId: CollectionWeaponId) => weapons[collectionWeaponId],
    [weapons],
  );

  const [activeTab, setActiveTab] = useState<SheetTab>('characters');
  const [selectedSlot, setSelectedSlot] = useState<TeamSlot | null>(null);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);

  const {
    teams,
    assignCharacter,
    removeCharacter,
    setTeamName,
    assignWeapon,
    removeWeapon,
    setArtifactPlan,
  } = useTeams();

  const selectedTeam = selectedSlot !== null ? teams[selectedSlot] : null;

  const selectedMember =
    selectedTeam && selectedMemberIndex !== null
      ? selectedTeam.members[selectedMemberIndex]
      : undefined;

  const selectedMemberWeaponType = useMemo(() => {
    if (!selectedMember) return undefined;
    const character = getCharacterById(selectedMember.characterId);
    return character?.weaponType;
  }, [selectedMember]);

  const handleToggleCharacter = useCallback(
    (characterId: string) => {
      if (selectedSlot === null || selectedMemberIndex === null) return;

      const currentMember = selectedTeam?.members[selectedMemberIndex];
      if (currentMember?.characterId === characterId) {
        removeCharacter(selectedSlot, selectedMemberIndex);
      } else {
        assignCharacter(selectedSlot, selectedMemberIndex, characterId);
      }
    },
    [selectedSlot, selectedMemberIndex, selectedTeam?.members, assignCharacter, removeCharacter],
  );

  const handleWeaponSelect = useCallback(
    (collectionWeaponId: CollectionWeaponId) => {
      if (selectedSlot === null || selectedMemberIndex === null) return;
      assignWeapon(selectedSlot, selectedMemberIndex, collectionWeaponId);
    },
    [selectedSlot, selectedMemberIndex, assignWeapon],
  );

  const handleWeaponClear = useCallback(() => {
    if (selectedSlot === null || selectedMemberIndex === null) return;
    removeWeapon(selectedSlot, selectedMemberIndex);
  }, [selectedSlot, selectedMemberIndex, removeWeapon]);

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
              getCollectionWeapon={getCollectionWeapon}
              onNameChange={(name) => setTeamName(slot, name)}
              onArtifactPlanChange={(memberIndex, plan) => setArtifactPlan(slot, memberIndex, plan)}
              onEdit={() => {
                setSelectedSlot(slot);
                setSelectedMemberIndex(null);
              }}
              onMemberSelect={(memberIndex) => {
                setSelectedSlot(slot);
                setSelectedMemberIndex(memberIndex);
              }}
            />
          </section>
        ))}
      </div>

      <Sheet
        open={selectedSlot !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSlot(null);
            setSelectedMemberIndex(null);
            setActiveTab('characters');
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto flex w-full max-w-7xl flex-col overflow-hidden rounded-t-xl top-0 sm:top-[124px]"
        >
          {selectedSlot !== null && selectedTeam && (
            <>
              <TeamStrip
                members={selectedTeam.members}
                selectedIndex={selectedMemberIndex}
                onSelect={setSelectedMemberIndex}
              />

              <div className="hidden sm:block">
                <TeamPlanner
                  slot={selectedSlot}
                  name={selectedTeam.name}
                  members={selectedTeam.members}
                  getCharacter={getCharacter}
                  getCollectionWeapon={getCollectionWeapon}
                  selectedMemberIndex={selectedMemberIndex}
                  onMemberSelect={setSelectedMemberIndex}
                  onNameChange={(name) => setTeamName(selectedSlot, name)}
                  onArtifactPlanChange={(memberIndex, plan) =>
                    setArtifactPlan(selectedSlot, memberIndex, plan)
                  }
                />
              </div>

              <nav className="mt-4 flex gap-4 border-b border-border" aria-label="Team editor tabs">
                <button
                  type="button"
                  className={`border-b-2 px-1 pb-2 text-sm font-semibold ${
                    activeTab === 'characters'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  aria-current={activeTab === 'characters' ? 'page' : undefined}
                  onClick={() => setActiveTab('characters')}
                >
                  Characters
                </button>
                <button
                  type="button"
                  className={`border-b-2 px-1 pb-2 text-sm font-semibold ${
                    activeTab === 'weapons'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  aria-current={activeTab === 'weapons' ? 'page' : undefined}
                  onClick={() => setActiveTab('weapons')}
                >
                  Weapons
                </button>
              </nav>

              <div className="mt-3 flex min-h-0 flex-1 flex-col">
                {activeTab === 'characters' && selectedMemberIndex !== null && (
                  <CharacterPool
                    characters={characters}
                    slot={selectedSlot!}
                    memberIndex={selectedMemberIndex}
                    onAssign={handleToggleCharacter}
                  />
                )}
                {activeTab === 'weapons' && selectedMember && selectedMemberWeaponType && (
                  <WeaponPool
                    key={selectedMemberWeaponType}
                    collectionWeapons={collectionWeapons}
                    weaponType={selectedMemberWeaponType}
                    selectedCollectionWeaponId={selectedMember.weaponInstanceId}
                    slot={selectedSlot!}
                    memberIndex={selectedMemberIndex!}
                    onSelect={handleWeaponSelect}
                    onClear={handleWeaponClear}
                  />
                )}
                {activeTab === 'weapons' && !selectedMember && (
                  <p className="text-sm text-muted-foreground">
                    Select a team member with an assigned character to choose a weapon.
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
