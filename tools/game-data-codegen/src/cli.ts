#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Command } from 'commander';

import { generateArtifactSets } from './artifacts.js';
import { generateCharacters } from './characters.js';
import { generateWeapons } from './weapons.js';

const program = new Command();

program
  .name('game-data-codegen')
  .description('Generate @genshin/game-data sources from the offline genshin-db dataset');

program
  .command('characters')
  .description('Regenerate the character roster in @genshin/game-data/src/characters.generated.ts')
  .action((): void => {
    const count = generateCharacters();
    console.log(`Generated ${count} characters into @genshin/game-data`);
  });

program
  .command('weapons')
  .description('Regenerate the weapon roster in @genshin/game-data/src/weapons.generated.ts')
  .action((): void => {
    const count = generateWeapons();
    console.log(`Generated ${count} weapons into @genshin/game-data`);
  });

program
  .command('artifacts')
  .description(
    'Regenerate the artifact set roster in @genshin/game-data/src/artifacts.generated.ts',
  )
  .action((): void => {
    const count = generateArtifactSets();
    console.log(`Generated ${count} artifact sets into @genshin/game-data`);
  });

program.parse();
