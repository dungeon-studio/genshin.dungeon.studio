#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Command } from 'commander';

import { generateArtifactSets } from './artifacts.js';
import { generateCharacters } from './characters.js';
import { generateResonances } from './resonances.js';
import { generateWeapons } from './weapons.js';

interface Roster {
  /** Subcommand name, which is also the generated module's basename. */
  command: string;
  /** Singular record name; the printed count appends an `s`. */
  label: string;
  generate: () => number | Promise<number>;
}

const ROSTERS: readonly Roster[] = [
  { command: 'characters', label: 'character', generate: generateCharacters },
  { command: 'weapons', label: 'weapon', generate: generateWeapons },
  { command: 'artifacts', label: 'artifact set', generate: generateArtifactSets },
  { command: 'resonances', label: 'elemental resonance', generate: generateResonances },
];

const program = new Command();

program
  .name('game-data-codegen')
  .description(
    'Generate @genshin/game-data sources from genshin-db and, for resonances, AnimeGameData',
  );

for (const { command, label, generate } of ROSTERS) {
  program
    .command(command)
    .description(`Regenerate the ${label} roster in @genshin/game-data/src/${command}.generated.ts`)
    .action(async (): Promise<void> => {
      console.log(`Generated ${await generate()} ${label}s into @genshin/game-data`);
    });
}

await program.parseAsync();
