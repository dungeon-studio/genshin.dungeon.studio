// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Counts the stored documents at each schema version, so a version's parse
// branch is retired on a census of the database rather than on read traffic,
// which never reaches cold documents. `--write` also rewrites the legacy ones
// at the current version. Reads every document, so it runs on demand: after a
// release that adds a version, and before retiring one.

import { parseArgs } from 'node:util';

import { sweep } from './legacy-sweep.js';

const { values } = parseArgs({ options: { write: { type: 'boolean', default: false } } });

const { census, rewritten } = await sweep({ write: values.write });

for (const [repository, counts] of Object.entries(census)) {
  const keys = [...counts.keys()].sort((a, b) => String(a).localeCompare(String(b)));
  for (const key of keys) {
    const label = key === 'invalid' ? 'invalid' : `v${key}`;
    console.log(`${repository}\t${label}\t${counts.get(key)}`);
  }
}

console.log(values.write ? `rewrote ${rewritten} legacy documents` : 'read-only: nothing written');
