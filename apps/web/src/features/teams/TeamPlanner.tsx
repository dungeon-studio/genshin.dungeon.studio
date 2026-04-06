// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { TeamMember } from '@genshin/domain';
import { MAX_TEAM_MEMBERS } from '@genshin/domain';

import { TeamCharacterPlanner } from '@/components/TeamCharacterPlanner';

interface TeamPlannerProps {
  name: string;
  members: TeamMember[];
}

export function TeamPlanner({ name, members }: TeamPlannerProps) {
  const slots = Array.from({ length: MAX_TEAM_MEMBERS }, (_, i) => members[i]);

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-foreground">{name}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {slots.map((member, i) => (
          <TeamCharacterPlanner key={i} member={member} />
        ))}
      </div>
    </section>
  );
}
