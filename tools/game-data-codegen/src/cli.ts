#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Command } from 'commander';

import { generateArtifactSets } from './artifacts.js';
import { generateCharacters } from './characters.js';
import { generateFirstBannerDates } from './paimon-moe.js';
import { generateResonances } from './resonances.js';
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

// genshin-db is slow to load, so one process serves every roster.
program
  .command('all')
  .description('Regenerate every genshin-db roster in @genshin/game-data')
  .action((): void => {
    ROSTERS.forEach(regenerate);
  });

// Fetches from paimon-moe, so `all` leaves it out to keep regeneration offline.
program
  .command('first-banner-dates')
  .description(
    "Regenerate src/first-banner-dates.generated.ts, which dates debuts, from paimon-moe's banners",
  )
  .action(async (): Promise<void> => {
    console.log(
      `Dated ${await generateFirstBannerDates()} characters; regenerate characters to apply`,
    );
  });

// Fetches from AnimeGameData, so `all` leaves it out to keep regeneration offline.
program
  .command('resonances')
  .description(
    'Regenerate the elemental resonance roster in @genshin/game-data/src/resonances.generated.ts',
  )
  .option(
    '--commit <sha>',
    'AnimeGameData commit to read, kept only when its resonances differ (default: the pinned one)',
  )
  .action(async ({ commit }: { commit?: string }): Promise<void> => {
    const { count, written } = await generateResonances(commit);
    console.log(
      written
        ? `Generated ${count} elemental resonances into @genshin/game-data`
        : `${count} elemental resonances unchanged; kept the pinned commit`,
    );
  });

await program.parseAsync();
