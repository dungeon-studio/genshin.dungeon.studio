// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Reads every document, so run it on demand: after a release that adds a
// schema version, and before retiring one. `--write` rewrites the legacy
// documents at the current version.

import { parseArgs } from 'node:util';

import { sweep } from './legacy-sweep.js';
import { db } from '../src/firebase/firestore.js';

const { values } = parseArgs({ options: { write: { type: 'boolean', default: false } } });

// listDocuments, unlike a query, includes users whose own document was never
// written but whose subcollections were.
const users = await db.collection('users').listDocuments();
const { census, rewritten } = await sweep(users, { write: values.write });

for (const [repository, counts] of census) {
  const versions = [...counts.keys()].filter((key) => key !== 'invalid').sort((a, b) => a - b);
  for (const version of versions) console.log(`${repository}\tv${version}\t${counts.get(version)}`);
  if (counts.has('invalid')) console.log(`${repository}\tinvalid\t${counts.get('invalid')}`);
}

console.log(values.write ? `rewrote ${rewritten} legacy documents` : 'read-only: nothing written');
