// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { TeamPlanner } from '@/features/teams/TeamPlanner';

const TEAM_NAMES = ['Team 1', 'Team 2', 'Team 3', 'Team 4'];

export function TeamsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="sr-only">Teams</h1>
      <div className="space-y-8">
        {TEAM_NAMES.map((name) => (
          <TeamPlanner key={name} name={name} members={[]} />
        ))}
      </div>
    </div>
  );
}
