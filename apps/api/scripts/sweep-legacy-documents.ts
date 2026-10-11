// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Counts the stored documents at each schema version, so a version's parse
// branch is retired on a census of the database rather than on read traffic,
// which never reaches cold documents. `--write` also rewrites the legacy ones
// at the current version. Reads every document, so it runs on demand: after a
// release that adds a version, and before retiring one.

import { parseArgs } from 'node:util';

import { sweep } from './legacy-sweep.js';
import { db } from '../src/firebase/firestore.js';

const { values } = parseArgs({ options: { write: { type: 'boolean', default: false } } });

// listDocuments, unlike a query, includes users whose own document was never
// written but whose subcollections were.
const users = await db.collection('users').listDocuments();
const { census, rewritten } = await sweep(users, { write: values.write });

for (const [repository, counts] of Object.entries(census)) {
  const versions = [...counts.keys()].filter((key) => key !== 'invalid').sort((a, b) => a - b);
  for (const version of versions) console.log(`${repository}\tv${version}\t${counts.get(version)}`);
  if (counts.has('invalid')) console.log(`${repository}\tinvalid\t${counts.get('invalid')}`);
}

console.log(values.write ? `rewrote ${rewritten} legacy documents` : 'read-only: nothing written');
