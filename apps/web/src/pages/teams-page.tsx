// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId, TeamSlot } from '@genshin/domain';
import { TEAM_SLOTS } from '@genshin/domain';
import { getCharacterById, getWeaponById } from '@genshin/game-data';
import type { JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { Container } from '@/components/chrome/container';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { useCollection } from '@/features/collection/characters/use-character-collection';
import { useWeaponCollection } from '@/features/collection/weapons/use-weapon-collection';
import { CharacterPool } from '@/features/teams/character-pool';
import { TeamPlanner } from '@/features/teams/team-planner';
import { TeamStrip } from '@/features/teams/team-strip';
import { usePendingWeapon } from '@/features/teams/use-pending-weapon';
import { useTeams } from '@/features/teams/use-teams';
import { WeaponPool } from '@/features/teams/weapon-pool';

type SheetTab = 'characters' | 'weapons';

export function TeamsPage(): JSX.Element {
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
    collectionWeaponId: pendingWeaponId,
    select: selectPendingWeapon,
    clear: clearPendingWeapon,
  } = usePendingWeapon(selectedSlot, selectedMemberIndex);

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

  // The member being edited, once both halves of its address are known.
  const editing = useMemo(
    () =>
      selectedSlot !== null && selectedMemberIndex !== null
        ? { slot: selectedSlot, memberIndex: selectedMemberIndex }
        : null,
    [selectedSlot, selectedMemberIndex],
  );

  const selectedMember =
    editing && selectedTeam ? selectedTeam.members[editing.memberIndex] : undefined;

  const pendingWeapon = useMemo(() => {
    if (!pendingWeaponId) return undefined;
    const collectionWeapon = weapons[pendingWeaponId];
    return collectionWeapon ? getWeaponById(collectionWeapon.weaponId) : undefined;
  }, [pendingWeaponId, weapons]);

  // Undefined on an empty member, where the whole owned pool is offered instead.
  const assignedCharacterWeaponType = useMemo(() => {
    if (!selectedMember) return undefined;
    return getCharacterById(selectedMember.characterId)?.weaponType;
  }, [selectedMember]);

  const handleToggleCharacter = useCallback(
    (characterId: string) => {
      if (!editing) return;

      if (selectedMember?.characterId === characterId) {
        removeCharacter(editing.slot, editing.memberIndex);
        return;
      }
      assignCharacter(editing.slot, editing.memberIndex, characterId, pendingWeaponId);
      clearPendingWeapon();
    },
    [
      editing,
      selectedMember?.characterId,
      assignCharacter,
      removeCharacter,
      pendingWeaponId,
      clearPendingWeapon,
    ],
  );

  // Without a character the choice has nowhere to persist, so it waits in the pending
  // slot instead of reaching the store.
  const handleWeaponSelect = useCallback(
    (collectionWeaponId: CollectionWeaponId) => {
      if (editing && selectedMember) {
        assignWeapon(editing.slot, editing.memberIndex, collectionWeaponId);
        return;
      }
      selectPendingWeapon(collectionWeaponId);
    },
    [editing, selectedMember, assignWeapon, selectPendingWeapon],
  );

  const handleWeaponClear = useCallback(() => {
    if (editing && selectedMember) {
      removeWeapon(editing.slot, editing.memberIndex);
      return;
    }
    clearPendingWeapon();
  }, [editing, selectedMember, removeWeapon, clearPendingWeapon]);

  return (
    <Container className="py-12">
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
            clearPendingWeapon();
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="max-w-7xl rounded-t-xl top-0 sm:top-[124px] mx-auto flex w-full flex-col overflow-hidden"
        >
          {selectedSlot !== null && selectedTeam && (
            <>
              <SheetHeader className="pt-6">
                <TeamStrip
                  members={selectedTeam.members}
                  selectedMemberIndex={selectedMemberIndex}
                  onSelect={setSelectedMemberIndex}
                  getCharacter={getCharacter}
                  getCollectionWeapon={getCollectionWeapon}
                />
              </SheetHeader>

              <nav className="mt-4 gap-4 flex border-b border-border" aria-label="Team editor tabs">
                <button
                  type="button"
                  className={`px-1 pb-2 text-sm font-semibold border-b-2 ${
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
                  className={`px-1 pb-2 text-sm font-semibold border-b-2 ${
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

              <div className="mt-3 min-h-0 gap-3 flex flex-1 flex-col">
                {editing === null ? (
                  <p className="text-sm text-muted-foreground">
                    Select a team member to choose a{' '}
                    {activeTab === 'characters' ? 'character' : 'weapon'}.
                  </p>
                ) : activeTab === 'characters' ? (
                  <>
                    {pendingWeapon && (
                      <div className="gap-3 px-3 py-2 text-sm flex items-center rounded-md bg-muted">
                        <p className="text-muted-foreground">
                          Showing {pendingWeapon.type} users for{' '}
                          <span className="font-medium text-foreground">{pendingWeapon.name}</span>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={clearPendingWeapon}
                        >
                          Clear weapon
                        </Button>
                      </div>
                    )}
                    <CharacterPool
                      characters={characters}
                      slot={editing.slot}
                      memberIndex={editing.memberIndex}
                      weaponType={pendingWeapon?.type}
                      onAssign={handleToggleCharacter}
                    />
                  </>
                ) : (
                  <WeaponPool
                    key={assignedCharacterWeaponType ?? 'any'}
                    collectionWeapons={collectionWeapons}
                    weaponType={assignedCharacterWeaponType}
                    selectedCollectionWeaponId={selectedMember?.weaponInstanceId ?? pendingWeaponId}
                    slot={editing.slot}
                    memberIndex={editing.memberIndex}
                    onSelect={handleWeaponSelect}
                    onClear={handleWeaponClear}
                  />
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Container>
  );
}
