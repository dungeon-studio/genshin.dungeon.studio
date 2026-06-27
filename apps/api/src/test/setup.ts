// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import fc from 'fast-check';

// Default to a fresh random seed each run so the generators keep exploring new
// inputs — that exploration is the whole point of property testing. fast-check
// prints the failing seed and counterexample on any failure; replay it with
// FAST_CHECK_SEED=<seed> to reproduce that run deterministically.
const requestedSeed = process.env.FAST_CHECK_SEED;
if (requestedSeed !== undefined && requestedSeed !== '') {
  const seed = Number(requestedSeed);
  if (!Number.isInteger(seed)) {
    throw new Error(`FAST_CHECK_SEED must be an integer, got: ${JSON.stringify(requestedSeed)}`);
  }
  fc.configureGlobal({ seed });
}
