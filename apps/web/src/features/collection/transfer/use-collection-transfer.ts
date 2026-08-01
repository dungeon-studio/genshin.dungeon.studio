// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeamMembers, ISOTimestamp } from '@genshin/domain';
import { MAX_TEAM_MEMBERS, nowTimestamp } from '@genshin/domain';
import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/use-auth';
import { useSetConstellationLevelMutation } from '@/features/collection/characters/use-character-collection-api';
import { useCollectionStore } from '@/features/collection/characters/use-character-collection-store';
import { useSaveWeaponMutation } from '@/features/collection/weapons/use-weapon-collection-api';
import { useWeaponCollectionStore } from '@/features/collection/weapons/use-weapon-collection-store';
import { useSaveTeamMutation } from '@/features/teams/use-team-api';
import { useTeamStore } from '@/features/teams/use-team-store';
import { downloadFile } from '@/lib/download-file';

import { buildTransferEnvelope, exportFilename, serialiseEnvelope } from './build-envelope';
import type { CollectionSnapshot } from './collection-snapshot';
import type {
  ImportPlan,
  PlannedCharacter,
  PlannedEntries,
  PlannedTeam,
  PlannedWeapon,
  TransferMembers,
} from './plan-import';
import { planImport, resolveTeamMembers } from './plan-import';
import { parseTransferEnvelope } from './schemas/index';

const EXPORT_MEDIA_TYPE = 'application/json';

/** Read the three stores as one value. They are the read layer signed in or out. */
function readSnapshot(): CollectionSnapshot {
  return {
    characters: useCollectionStore.getState().characters,
    weapons: useWeaponCollectionStore.getState().weapons,
    teams: useTeamStore.getState().teams,
  };
}

/** Create and update are written the same way; only the bucketing differed. */
function allOf<T>(entries: PlannedEntries<T>): T[] {
  return [...entries.create, ...entries.update];
}

/** Keep an entry's original creation time, and stamp this write as the update. */
function restamp(
  existing: { createdAt: ISOTimestamp } | undefined,
  now: ISOTimestamp,
): { createdAt: ISOTimestamp; updatedAt: ISOTimestamp } {
  return { createdAt: existing?.createdAt ?? now, updatedAt: now };
}

/** Teams are a fixed 4-tuple; an envelope may carry fewer positions than that. */
function padMembers(members: TransferMembers): CollectionTeamMembers {
  const padded: TransferMembers = [...members];
  while (padded.length < MAX_TEAM_MEMBERS) padded.push(null);
  return padded.slice(0, MAX_TEAM_MEMBERS) as CollectionTeamMembers;
}

export type ReadPlanResult = { ok: true; plan: ImportPlan } | { ok: false; message: string };

export interface UseCollectionTransferResult {
  exportCollection: () => void;
  readPlan: (file: File) => Promise<ReadPlanResult>;
  applyImport: (plan: ImportPlan) => Promise<void>;
  isImporting: boolean;
}

export function useCollectionTransfer(): UseCollectionTransferResult {
  const { user } = useAuth();
  const isAuthenticated = user !== null;

  const replaceCharacters = useCollectionStore((s) => s.replaceCharacters);
  const storeAddWeapon = useWeaponCollectionStore((s) => s.addWeapon);
  const storeSetTeam = useTeamStore((s) => s.setTeam);

  const { mutateAsync: saveCharacterApi } = useSetConstellationLevelMutation(user?.uid);
  const { mutateAsync: saveWeaponApi } = useSaveWeaponMutation(user?.uid);
  const { mutateAsync: saveTeamApi } = useSaveTeamMutation(user?.uid);

  const [isImporting, setIsImporting] = useState(false);

  const exportCollection = useCallback(() => {
    const exportedAt = new Date().toISOString();
    const envelope = buildTransferEnvelope(readSnapshot(), exportedAt);

    downloadFile(exportFilename(exportedAt), serialiseEnvelope(envelope), EXPORT_MEDIA_TYPE);
  }, []);

  const readPlan = useCallback(async (file: File): Promise<ReadPlanResult> => {
    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      return { ok: false, message: 'This file is not valid JSON.' };
    }

    const parsed = parseTransferEnvelope(raw);
    if (!parsed.ok) return { ok: false, message: parsed.message };

    return { ok: true, plan: planImport(parsed.envelope, readSnapshot()) };
  }, []);

  const importWeapons = useCallback(
    async (entries: PlannedWeapon[]) => {
      for (const entry of entries) {
        if (isAuthenticated) await saveWeaponApi(entry);

        const existing = useWeaponCollectionStore.getState().weapons[entry.weaponInstanceId];
        storeAddWeapon({ ...entry, ...restamp(existing, nowTimestamp()) });
      }
    },
    [isAuthenticated, saveWeaponApi, storeAddWeapon],
  );

  const importCharacters = useCallback(
    async (entries: PlannedCharacter[]) => {
      if (entries.length === 0) return;

      // One store write for the whole set; the API takes them one at a time.
      const now = nowTimestamp();
      const next = { ...useCollectionStore.getState().characters };
      for (const entry of entries) {
        next[entry.characterId] = { ...entry, ...restamp(next[entry.characterId], now) };
      }
      replaceCharacters(next);

      if (!isAuthenticated) return;
      for (const entry of entries) {
        await saveCharacterApi({
          characterId: entry.characterId,
          level: entry.constellationLevel,
        });
      }
    },
    [isAuthenticated, saveCharacterApi, replaceCharacters],
  );

  const importTeams = useCallback(
    async (entries: PlannedTeam[], importedWeaponIds: ReadonlySet<string>) => {
      // Re-read: the weapons this import just wrote are what the members resolve
      // against, and they landed after the plan was drawn up.
      const snapshot = readSnapshot();

      for (const entry of entries) {
        const payload = {
          slot: entry.slot,
          name: entry.name,
          members: padMembers(resolveTeamMembers(entry, importedWeaponIds, snapshot)),
          ...(entry.description !== undefined ? { description: entry.description } : {}),
        };

        storeSetTeam(entry.slot, {
          ...payload,
          ...restamp(snapshot.teams[entry.slot], nowTimestamp()),
        });

        if (isAuthenticated) await saveTeamApi(payload);
      }
    },
    [isAuthenticated, saveTeamApi, storeSetTeam],
  );

  const applyImport = useCallback(
    async (plan: ImportPlan) => {
      setIsImporting(true);
      try {
        // Weapons first: team members reference them by instance id, so the
        // references a team carries have to resolve by the time it is written.
        const weapons = allOf(plan.weapons);
        await importWeapons(weapons);
        await importCharacters(allOf(plan.characters));
        await importTeams(
          allOf(plan.teams),
          new Set(weapons.map((weapon) => weapon.weaponInstanceId)),
        );
      } finally {
        setIsImporting(false);
      }
    },
    [importWeapons, importCharacters, importTeams],
  );

  return { exportCollection, readPlan, applyImport, isImporting };
}
