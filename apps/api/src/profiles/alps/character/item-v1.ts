// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AlpsProfile } from '@/profiles/alps/profile.js';

export const characterItemV1 = {
  path: '/profiles/character/item-v1.json',
  profile: {
    alps: {
      version: '1.0',
      doc: {
        value: "A playable character from the world of Teyvat, tracked in a player's collection",
      },
      descriptor: [
        {
          id: 'characterId',
          type: 'semantic',
          doc: {
            value: 'Unique name that identifies a character (e.g. albedo, hu-tao)',
          },
        },
        {
          id: 'constellationLevel',
          type: 'semantic',
          doc: {
            value: 'Number of constellations unlocked (0 = base, 6 = fully unlocked)',
          },
        },
        {
          id: 'createdAt',
          type: 'semantic',
          doc: {
            value: 'When the character was added to the collection',
          },
        },
        {
          id: 'updatedAt',
          type: 'semantic',
          doc: {
            value: 'When the character was last modified',
          },
        },
      ],
    },
  },
} as const satisfies AlpsProfile;
