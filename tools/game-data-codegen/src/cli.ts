#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Command } from 'commander';

import { generateWeapons } from './weapons.js';

const program = new Command();

program
  .name('game-data-codegen')
  .description('Generate @genshin/game-data sources from the offline genshin-db dataset');

program
  .command('weapons')
  .description('Regenerate the weapon roster in @genshin/game-data/src/weapons.ts')
  .action((): void => {
    const count = generateWeapons();
    console.log(`Generated ${count} weapons into @genshin/game-data`);
  });

program.parse();
