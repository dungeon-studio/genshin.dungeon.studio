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
import { useTeams } from '@/features/teams/use-teams';
import { WeaponPool } from '@/features/teams/weapon-pool';

type SheetTab = 'characters' | 'weapons';

/**
 * A weapon chosen for a member that has no character yet. The domain model has no
 * home for it — a team member is keyed by its character — so it is held here until a
 * character assignment commits the pair, and dropped if the user leaves without one.
 */
interface PendingWeapon {
  slot: TeamSlot;
  memberIndex: number;
  collectionWeaponId: CollectionWeaponId;
}

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
  const [pendingWeapon, setPendingWeapon] = useState<PendingWeapon | null>(null);

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

  // Only honour a pending weapon while its own member is the one being edited.
  const activePendingWeaponId =
    pendingWeapon &&
    pendingWeapon.slot === selectedSlot &&
    pendingWeapon.memberIndex === selectedMemberIndex
      ? pendingWeapon.collectionWeaponId
      : undefined;

  const pendingWeaponData = useMemo(() => {
    if (!activePendingWeaponId) return undefined;
    const collectionWeapon = weapons[activePendingWeaponId];
    return collectionWeapon ? getWeaponById(collectionWeapon.weaponId) : undefined;
  }, [activePendingWeaponId, weapons]);

  // Constrains the weapon pool once a character is assigned. Undefined on an empty
  // member, where the whole owned pool is offered instead.
  const selectedMemberWeaponType = useMemo(() => {
    if (!selectedMember) return undefined;
    return getCharacterById(selectedMember.characterId)?.weaponType;
  }, [selectedMember]);

  const handleToggleCharacter = useCallback(
    (characterId: string) => {
      if (selectedSlot === null || selectedMemberIndex === null) return;

      const currentMember = selectedTeam?.members[selectedMemberIndex];
      if (currentMember?.characterId === characterId) {
        removeCharacter(selectedSlot, selectedMemberIndex);
      } else {
        assignCharacter(selectedSlot, selectedMemberIndex, characterId, activePendingWeaponId);
        setPendingWeapon(null);
      }
    },
    [
      selectedSlot,
      selectedMemberIndex,
      selectedTeam?.members,
      assignCharacter,
      removeCharacter,
      activePendingWeaponId,
    ],
  );

  const handleWeaponSelect = useCallback(
    (collectionWeaponId: CollectionWeaponId) => {
      if (selectedSlot === null || selectedMemberIndex === null) return;
      if (selectedMember) {
        assignWeapon(selectedSlot, selectedMemberIndex, collectionWeaponId);
        return;
      }
      setPendingWeapon({
        slot: selectedSlot,
        memberIndex: selectedMemberIndex,
        collectionWeaponId,
      });
    },
    [selectedSlot, selectedMemberIndex, selectedMember, assignWeapon],
  );

  const handleWeaponClear = useCallback(() => {
    if (selectedSlot === null || selectedMemberIndex === null) return;
    if (selectedMember) {
      removeWeapon(selectedSlot, selectedMemberIndex);
      return;
    }
    setPendingWeapon(null);
  }, [selectedSlot, selectedMemberIndex, selectedMember, removeWeapon]);

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
            setPendingWeapon(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto flex w-full max-w-7xl flex-col overflow-hidden rounded-t-xl top-0 sm:top-[124px]"
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

              <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
                {activeTab === 'characters' && selectedMemberIndex !== null && (
                  <>
                    {pendingWeaponData && (
                      <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-sm">
                        <p className="text-muted-foreground">
                          Showing {pendingWeaponData.type} users for{' '}
                          <span className="font-medium text-foreground">
                            {pendingWeaponData.name}
                          </span>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={() => setPendingWeapon(null)}
                        >
                          Clear weapon
                        </Button>
                      </div>
                    )}
                    <CharacterPool
                      characters={characters}
                      slot={selectedSlot}
                      memberIndex={selectedMemberIndex}
                      weaponType={pendingWeaponData?.type}
                      onAssign={handleToggleCharacter}
                    />
                  </>
                )}
                {activeTab === 'characters' && selectedMemberIndex === null && (
                  <p className="text-sm text-muted-foreground">
                    Select a team member to choose a character.
                  </p>
                )}
                {activeTab === 'weapons' && selectedMemberIndex !== null && (
                  <WeaponPool
                    key={selectedMemberWeaponType ?? 'any'}
                    collectionWeapons={collectionWeapons}
                    weaponType={selectedMemberWeaponType}
                    selectedCollectionWeaponId={
                      selectedMember?.weaponInstanceId ?? activePendingWeaponId
                    }
                    slot={selectedSlot}
                    memberIndex={selectedMemberIndex}
                    onSelect={handleWeaponSelect}
                    onClear={handleWeaponClear}
                  />
                )}
                {activeTab === 'weapons' && selectedMemberIndex === null && (
                  <p className="text-sm text-muted-foreground">
                    Select a team member to choose a weapon.
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Container>
  );
}
