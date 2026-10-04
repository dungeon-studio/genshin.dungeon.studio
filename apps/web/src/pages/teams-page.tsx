// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId, TeamSlot } from '@genshin/domain';
import { TEAM_SLOTS } from '@genshin/domain';
import { getCharacterById, getWeaponById } from '@genshin/game-data';
import { Users } from 'lucide-react';
import type { JSX, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { Container } from '@/components/chrome/container';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { useCollection } from '@/features/collection/characters/use-character-collection';
import type { CharacterCollection } from '@/features/collection/characters/use-character-collection-store';
import { ownedCharacters } from '@/features/collection/characters/use-character-collection-store';
import { EmptyCollection } from '@/features/collection/empty-collection';
import { useWeaponCollection } from '@/features/collection/weapons/use-weapon-collection';
import { CharacterPool } from '@/features/teams/character-pool';
import { TeamPlanner } from '@/features/teams/team-planner';
import { TeamStrip } from '@/features/teams/team-strip';
import { usePendingWeapon } from '@/features/teams/use-pending-weapon';
import type { UseTeamsResult } from '@/features/teams/use-teams';
import { useTeams } from '@/features/teams/use-teams';
import { WeaponPool } from '@/features/teams/weapon-pool';

type SheetTab = 'characters' | 'weapons';

type MemberEditorActions = Pick<
  UseTeamsResult,
  'assignCharacter' | 'removeCharacter' | 'assignWeapon' | 'removeWeapon'
>;

/** Which member the editor sheet is pointed at, and the edits it makes there. */
function useMemberEditor(
  weapons: Record<CollectionWeaponId, CollectionWeapon>,
  teams: UseTeamsResult['teams'],
  actions: MemberEditorActions,
) {
  const { assignCharacter, removeCharacter, assignWeapon, removeWeapon } = actions;
  const [selectedSlot, setSelectedSlot] = useState<TeamSlot | null>(null);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);

  const {
    collectionWeaponId: pendingWeaponId,
    select: selectPendingWeapon,
    clear: clearPendingWeapon,
  } = usePendingWeapon(selectedSlot, selectedMemberIndex);

  // The member being edited, once both halves of its address are known.
  const editing = useMemo(
    () =>
      selectedSlot !== null && selectedMemberIndex !== null
        ? { slot: selectedSlot, memberIndex: selectedMemberIndex }
        : null,
    [selectedSlot, selectedMemberIndex],
  );

  const selectedMember = editing ? teams[editing.slot].members[editing.memberIndex] : undefined;

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

  const select = useCallback((slot: TeamSlot | null, memberIndex: number | null) => {
    setSelectedSlot(slot);
    setSelectedMemberIndex(memberIndex);
  }, []);

  const close = useCallback(() => {
    select(null, null);
    clearPendingWeapon();
  }, [select, clearPendingWeapon]);

  const toggleCharacter = useCallback(
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

  const selectWeapon = useCallback(
    (collectionWeaponId: CollectionWeaponId) => {
      if (editing && selectedMember) {
        assignWeapon(editing.slot, editing.memberIndex, collectionWeaponId);
        return;
      }
      selectPendingWeapon(collectionWeaponId);
    },
    [editing, selectedMember, assignWeapon, selectPendingWeapon],
  );

  const clearWeapon = useCallback(() => {
    if (editing && selectedMember) {
      removeWeapon(editing.slot, editing.memberIndex);
      return;
    }
    clearPendingWeapon();
  }, [editing, selectedMember, removeWeapon, clearPendingWeapon]);

  return {
    selectedSlot,
    selectedMemberIndex,
    editing,
    selectedMember,
    pendingWeaponId,
    pendingWeapon,
    assignedCharacterWeaponType,
    select,
    close,
    clearPendingWeapon,
    toggleCharacter,
    selectWeapon,
    clearWeapon,
  };
}

type MemberEditor = ReturnType<typeof useMemberEditor>;

export function TeamsPage(): JSX.Element {
  const { characters, getCharacter, isLoading: collectionLoading } = useCollection();
  const { weapons } = useWeaponCollection();

  const collectionEmpty = !collectionLoading && ownedCharacters(characters).length === 0;

  const collectionWeapons = useMemo(() => Object.values(weapons), [weapons]);

  const getCollectionWeapon = useCallback(
    (collectionWeaponId: CollectionWeaponId) => weapons[collectionWeaponId],
    [weapons],
  );

  const {
    teams,
    assignCharacter,
    removeCharacter,
    setTeamName,
    assignWeapon,
    removeWeapon,
    setArtifactPlan,
  } = useTeams();

  const [activeTab, setActiveTab] = useState<SheetTab>('characters');
  const editor = useMemberEditor(weapons, teams, {
    assignCharacter,
    removeCharacter,
    assignWeapon,
    removeWeapon,
  });
  const { selectedSlot, selectedMemberIndex } = editor;
  const selectedTeam = selectedSlot !== null ? teams[selectedSlot] : null;

  return (
    <Container className="py-12">
      <h1 className="sr-only">Teams</h1>

      {collectionEmpty && <EmptyCollectionPrompt />}

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
              onEdit={() => editor.select(slot, null)}
              onMemberSelect={(memberIndex) => editor.select(slot, memberIndex)}
            />
          </section>
        ))}
      </div>

      <Sheet
        open={selectedSlot !== null}
        onOpenChange={(open) => {
          if (!open) {
            editor.close();
            setActiveTab('characters');
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
                  onSelect={(memberIndex) => editor.select(selectedSlot, memberIndex)}
                  getCharacter={getCharacter}
                  getCollectionWeapon={getCollectionWeapon}
                />
              </SheetHeader>

              <nav className="mt-4 gap-4 flex border-b border-border" aria-label="Team editor tabs">
                <TabButton tab="characters" activeTab={activeTab} onSelect={setActiveTab}>
                  Characters
                </TabButton>
                <TabButton tab="weapons" activeTab={activeTab} onSelect={setActiveTab}>
                  Weapons
                </TabButton>
              </nav>

              <div className="mt-3 min-h-0 gap-3 flex flex-1 flex-col">
                <TeamEditorPanel
                  editor={editor}
                  activeTab={activeTab}
                  characters={characters}
                  collectionWeapons={collectionWeapons}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Container>
  );
}

/**
 * Leaves the team rows in place: a user who removes every character still sees the teams
 * that reference them.
 */
function EmptyCollectionPrompt(): JSX.Element {
  return (
    <EmptyCollection
      icon={Users}
      title="No characters in your collection"
      description="Add the characters you own to start building teams."
      to="/characters"
      action="Go to Characters"
      className="mb-8 rounded-lg border border-border"
    />
  );
}

interface TabButtonProps {
  tab: SheetTab;
  activeTab: SheetTab;
  onSelect: (tab: SheetTab) => void;
  children: ReactNode;
}

function TabButton({ tab, activeTab, onSelect, children }: TabButtonProps): JSX.Element {
  const active = tab === activeTab;
  return (
    <button
      type="button"
      className={`px-1 pb-2 text-sm font-semibold border-b-2 ${
        active
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
      aria-current={active ? 'page' : undefined}
      onClick={() => onSelect(tab)}
    >
      {children}
    </button>
  );
}

interface TeamEditorPanelProps {
  editor: MemberEditor;
  activeTab: SheetTab;
  characters: CharacterCollection;
  collectionWeapons: CollectionWeapon[];
}

/** The active tab's pool, or a prompt to pick a member when none is selected. */
function TeamEditorPanel({
  editor,
  activeTab,
  characters,
  collectionWeapons,
}: TeamEditorPanelProps): JSX.Element {
  const { editing, pendingWeapon, assignedCharacterWeaponType } = editor;

  if (editing === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a team member to choose a {activeTab === 'characters' ? 'character' : 'weapon'}.
      </p>
    );
  }

  if (activeTab === 'weapons') {
    return (
      <WeaponPool
        key={assignedCharacterWeaponType ?? 'any'}
        collectionWeapons={collectionWeapons}
        weaponType={assignedCharacterWeaponType}
        selectedCollectionWeaponId={
          editor.selectedMember?.weaponInstanceId ?? editor.pendingWeaponId
        }
        slot={editing.slot}
        memberIndex={editing.memberIndex}
        onSelect={editor.selectWeapon}
        onClear={editor.clearWeapon}
      />
    );
  }

  return (
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
            onClick={editor.clearPendingWeapon}
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
        onAssign={editor.toggleCharacter}
      />
    </>
  );
}
