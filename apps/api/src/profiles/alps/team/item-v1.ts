// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AlpsProfile } from '@/profiles/alps/profile.js';

export const teamItemV1 = {
  path: '/profiles/alps/team/item-v1.json',
  profile: {
    alps: {
      version: '1.0',
      doc: {
        value: 'A team composition of up to 4 characters with equipped weapons and artifact plans',
      },
      descriptor: [
        {
          id: 'slot',
          type: 'semantic',
          doc: {
            value: 'Team loadout slot number (1-4)',
          },
        },
        {
          id: 'name',
          type: 'semantic',
          doc: {
            value: 'Display name for the team (1-50 characters)',
          },
        },
        {
          id: 'members',
          type: 'semantic',
          doc: {
            value:
              'Team members (exactly 4 character positions; null represents an empty position)',
          },
          descriptor: [
            {
              id: 'characterId',
              type: 'semantic',
              doc: {
                value: 'Character ID from game data (required)',
              },
            },
            {
              id: 'weaponInstanceId',
              type: 'semantic',
              doc: {
                value:
                  "Weapon instance UUID from user's collection (optional; omit for optimizer to fill)",
              },
            },
            {
              id: 'artifactPlan',
              type: 'semantic',
              doc: {
                value: 'Desired artifact configuration for this member (optional)',
              },
              descriptor: [
                {
                  id: 'sands',
                  type: 'semantic',
                  doc: {
                    value: 'Desired main stat for Sands of Eon',
                  },
                },
                {
                  id: 'goblet',
                  type: 'semantic',
                  doc: {
                    value: 'Desired main stat for Goblet of Eonothem',
                  },
                },
                {
                  id: 'circlet',
                  type: 'semantic',
                  doc: {
                    value: 'Desired main stat for Circlet of Logos',
                  },
                },
                {
                  id: 'sets',
                  type: 'semantic',
                  doc: {
                    value: '1-2 artifact set IDs from game data',
                  },
                },
                {
                  id: 'priorityMinorAffixes',
                  type: 'semantic',
                  doc: {
                    value: '0-3 priority minor affixes',
                  },
                },
                {
                  id: 'secondaryMinorAffixes',
                  type: 'semantic',
                  doc: {
                    value:
                      '0-3 secondary minor affixes (must be disjoint from priorityMinorAffixes)',
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'description',
          type: 'semantic',
          doc: {
            value: 'Optional description of the team (max 200 characters)',
          },
        },
        {
          id: 'createdAt',
          type: 'semantic',
          doc: {
            value: 'When the team was created',
          },
        },
        {
          id: 'updatedAt',
          type: 'semantic',
          doc: {
            value: 'When the team was last modified',
          },
        },
      ],
    },
  },
} as const satisfies AlpsProfile;
