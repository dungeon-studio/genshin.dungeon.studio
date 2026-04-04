// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { characterItemV1 } from '@/profiles/alps/character/item-v1.js';
import type { AlpsProfile } from '@/profiles/alps/profile.js';
import { teamItemV1 } from '@/profiles/alps/team/item-v1.js';
import { weaponItemV1 } from '@/profiles/alps/weapon/item-v1.js';

export const alpsRegistry: readonly AlpsProfile[] = [characterItemV1, teamItemV1, weaponItemV1];
