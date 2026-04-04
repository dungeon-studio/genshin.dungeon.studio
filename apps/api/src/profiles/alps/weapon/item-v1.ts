// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AlpsProfile } from '@/profiles/alps/profile.js';

export const weaponItemV1 = {
  path: '/profiles/alps/weapon/item-v1.json',
  profile: {
    alps: {
      version: '1.0',
      doc: {
        value:
          'A weapon owned by a player, which can have multiple copies with different refinement levels',
      },
      descriptor: [
        {
          id: 'weaponInstanceId',
          type: 'semantic',
          doc: {
            value: 'Unique identifier distinguishing one copy of a weapon from another',
          },
        },
        {
          id: 'weaponId',
          type: 'semantic',
          doc: {
            value: 'Identifies which weapon this is (e.g. mistsplitter-reforged, wolfs-gravestone)',
          },
        },
        {
          id: 'refinementLevel',
          type: 'semantic',
          doc: {
            value: 'Number of refinements applied (1 = base, 5 = fully refined)',
          },
        },
        {
          id: 'createdAt',
          type: 'semantic',
          doc: {
            value: 'When the weapon was added to the collection',
          },
        },
        {
          id: 'updatedAt',
          type: 'semantic',
          doc: {
            value: 'When the weapon was last modified',
          },
        },
      ],
    },
  },
} as const satisfies AlpsProfile;
