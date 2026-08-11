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
  /** Singular record name; pluralised for the count this prints. */
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

for (const { command, label, generate } of ROSTERS) {
  program
    .command(command)
    .description(`Regenerate the ${label} roster in @genshin/game-data/src/${command}.generated.ts`)
    .action((): void => {
      console.log(`Generated ${generate()} ${label}s into @genshin/game-data`);
    });
}

program.parse();
