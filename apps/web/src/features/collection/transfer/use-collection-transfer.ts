// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeamMembers, CollectionWeapon, CollectionWeaponId } from '@genshin/domain';
import { nowTimestamp } from '@genshin/domain';
import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/use-auth';
import { useSetConstellationLevelMutation } from '@/features/collection/characters/use-character-collection-api';
import { useCollectionStore } from '@/features/collection/characters/use-character-collection-store';
import { useSaveWeaponMutation } from '@/features/collection/weapons/use-weapon-collection-api';
import { useWeaponCollectionStore } from '@/features/collection/weapons/use-weapon-collection-store';
import { useSaveTeamMutation } from '@/features/teams/use-team-api';
import { useTeamStore } from '@/features/teams/use-team-store';

import { buildTransferEnvelope, exportFilename, serialiseEnvelope } from './build-envelope';
import type { CollectionSnapshot } from './collection-snapshot';
import type { ImportPlan } from './plan-import';
import {
  asCharacterId,
  asTeamSlot,
  asWeaponInstanceId,
  planImport,
  resolveTeamMembers,
} from './plan-import';
import type { ParseEnvelopeResult } from './schemas/index';
import { parseTransferEnvelope } from './schemas/index';

/** Read the three stores as one value. They are the read layer signed in or out. */
function readSnapshot(): CollectionSnapshot {
  return {
    characters: useCollectionStore.getState().characters,
    weapons: useWeaponCollectionStore.getState().weapons,
    teams: useTeamStore.getState().teams,
  };
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

    const blob = new Blob([serialiseEnvelope(envelope)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportFilename(exportedAt);
    anchor.click();

    URL.revokeObjectURL(url);
  }, []);

  const readPlan = useCallback(async (file: File): Promise<ReadPlanResult> => {
    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      return { ok: false, message: 'This file is not valid JSON.' };
    }

    const parsed: ParseEnvelopeResult = parseTransferEnvelope(raw);
    if (!parsed.ok) return { ok: false, message: parsed.message };

    return { ok: true, plan: planImport(parsed.envelope, readSnapshot()) };
  }, []);

  const applyImport = useCallback(
    async (plan: ImportPlan) => {
      setIsImporting(true);
      try {
        // Weapons first: team members reference them by instance id, so the
        // references a team carries have to resolve by the time it is written.
        const weapons = [...plan.weapons.create, ...plan.weapons.update];
        for (const entry of weapons) {
          const weaponInstanceId = asWeaponInstanceId(entry.weaponInstanceId);
          if (isAuthenticated) {
            await saveWeaponApi({
              weaponInstanceId,
              weaponId: entry.weaponId,
              refinementLevel: entry.refinementLevel,
            });
          }
          storeAddWeapon(localWeapon(weaponInstanceId, entry.weaponId, entry.refinementLevel));
        }

        // Characters go through the store in one write. The API mutation is a
        // PUT upsert, so an existing character is replaced rather than duplicated.
        const characters = [...plan.characters.create, ...plan.characters.update];
        if (characters.length > 0) {
          const now = nowTimestamp();
          const next = { ...useCollectionStore.getState().characters };
          for (const entry of characters) {
            const characterId = asCharacterId(entry.characterId);
            next[characterId] = {
              characterId,
              constellationLevel: entry.constellationLevel,
              createdAt: next[characterId]?.createdAt ?? now,
              updatedAt: now,
            };
          }
          replaceCharacters(next);

          if (isAuthenticated) {
            for (const entry of characters) {
              await saveCharacterApi({
                characterId: asCharacterId(entry.characterId),
                level: entry.constellationLevel,
              });
            }
          }
        }

        const importedWeaponIds = new Set(weapons.map((w) => w.weaponInstanceId));
        const snapshot = readSnapshot();

        for (const entry of [...plan.teams.create, ...plan.teams.update]) {
          const slot = asTeamSlot(entry.slot);
          const members = padMembers(resolveTeamMembers(entry, importedWeaponIds, snapshot));
          const existing = snapshot.teams[slot];

          storeSetTeam(slot, {
            slot,
            name: entry.name,
            members,
            ...(entry.description !== undefined ? { description: entry.description } : {}),
            createdAt: existing?.createdAt ?? nowTimestamp(),
            updatedAt: nowTimestamp(),
          });

          if (isAuthenticated) {
            await saveTeamApi({
              slot,
              name: entry.name,
              members,
              ...(entry.description !== undefined ? { description: entry.description } : {}),
            });
          }
        }
      } finally {
        setIsImporting(false);
      }
    },
    [
      isAuthenticated,
      saveCharacterApi,
      saveWeaponApi,
      saveTeamApi,
      replaceCharacters,
      storeAddWeapon,
      storeSetTeam,
    ],
  );

  return { exportCollection, readPlan, applyImport, isImporting };
}

function localWeapon(
  weaponInstanceId: CollectionWeaponId,
  weaponId: string,
  refinementLevel: number,
): CollectionWeapon {
  const existing = useWeaponCollectionStore.getState().weapons[weaponInstanceId];
  const now = nowTimestamp();

  return {
    weaponInstanceId,
    weaponId,
    refinementLevel,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/** Teams are a fixed 4-tuple; an envelope may carry fewer positions than that. */
function padMembers(members: ReturnType<typeof resolveTeamMembers>): CollectionTeamMembers {
  const padded = [...members];
  while (padded.length < 4) padded.push(null);
  return padded.slice(0, 4) as CollectionTeamMembers;
}
