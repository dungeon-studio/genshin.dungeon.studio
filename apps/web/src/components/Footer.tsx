// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GAME_DATA_VERSION } from '@genshin/game-data';

const GITHUB_REPO = 'https://github.com/dungeon-studio/genshin.dungeon.studio';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <li>
              <a
                href={`${GITHUB_REPO}/issues/new?template=bug-report.yml`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                Report an issue
              </a>
            </li>
            <li>
              <a
                href={`${GITHUB_REPO}/issues/new?template=feature-request.yml`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                Request a feature
              </a>
            </li>
            <li>
              <a
                href={`${GITHUB_REPO}/discussions`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                Discussions
              </a>
            </li>
            <li>
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
        <p className="mt-4 text-xs text-muted-foreground/70">
          Game data current as of {GAME_DATA_VERSION}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">© 2026 Dungeon Studio</p>
      </div>
    </footer>
  );
}
