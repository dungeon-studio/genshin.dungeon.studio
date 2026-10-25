// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Run via `turbo run schemas:export` so workspace dependencies build first.

import { fileURLToPath } from 'node:url';

import { exportSnapshots } from '@genshin/schema-snapshots';

import { SCHEMA_REGISTRY } from './schema-registry.js';

exportSnapshots(SCHEMA_REGISTRY, fileURLToPath(new URL('../schema-snapshots', import.meta.url)));
