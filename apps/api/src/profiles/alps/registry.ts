// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { characterItemV1 } from '@/profiles/alps/character/item-v1.js';
import type { AlpsProfile } from '@/profiles/alps/profile.js';
import { teamItemV1 } from '@/profiles/alps/team/item-v1.js';
import { weaponItemV1 } from '@/profiles/alps/weapon/item-v1.js';

/**
 * Every ALPS profile the API serves.
 *
 * The one list the profile route walks, so a module missing from here is
 * unreachable however correct it is.
 */
export const alpsRegistry: readonly AlpsProfile[] = [characterItemV1, teamItemV1, weaponItemV1];
