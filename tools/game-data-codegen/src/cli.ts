#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Command } from 'commander';

import { generateArtifactSets } from './artifacts.js';
import { generateCharacters } from './characters.js';
import { generateWeapons } from './weapons.js';

interface Roster {
  /** Subcommand name, which is also the generated module's basename. */
  command: string;
  /** Singular record name; the printed count appends an `s`. */
  label: string;
  generate: () => number;
}

const ROSTERS: readonly Roster[] = [
  { command: 'characters', label: 'character', generate: generateCharacters },
  { command: 'weapons', label: 'weapon', generate: generateWeapons },
  { command: 'artifacts', label: 'artifact set', generate: generateArtifactSets },
];

const program = new Command();

program
  .name('game-data-codegen')
  .description('Generate @genshin/game-data sources from the offline genshin-db dataset');

function regenerate({ label, generate }: Roster): void {
  console.log(`Generated ${generate()} ${label}s into @genshin/game-data`);
}

for (const roster of ROSTERS) {
  program
    .command(roster.command)
    .description(
      `Regenerate the ${roster.label} roster in @genshin/game-data/src/${roster.command}.generated.ts`,
    )
    .action((): void => {
      regenerate(roster);
    });
}

// One process loads genshin-db once, where a run per roster loads it each time.
program
  .command('all')
  .description('Regenerate every roster in @genshin/game-data')
  .action((): void => {
    ROSTERS.forEach(regenerate);
  });

program.parse();
