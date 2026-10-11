// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_ROSTER } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TeamMemberPlanner } from './team-member-planner';

const CHARACTER = CHARACTER_ROSTER[0];
if (!CHARACTER) throw new Error('no character in game data');

describe('TeamMemberPlanner', () => {
  it('selects the member from its summary but not from its artifact controls', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <TeamMemberPlanner
        member={{ characterId: CHARACTER.id, artifactPlan: { priorityMinorAffixes: ['HP'] } }}
        onSelect={onSelect}
        onArtifactPlanChange={vi.fn()}
      />,
    );

    const sands = screen.getByLabelText('Sands of Eon');
    await user.selectOptions(sands, 'Energy Recharge');
    sands.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.selectOptions(screen.getByLabelText('Add priority substats'), 'CRIT DMG');
    await user.click(screen.getByRole('button', { name: 'Remove HP' }));

    expect(onSelect).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: new RegExp(CHARACTER.name) }));

    expect(onSelect).toHaveBeenCalledOnce();
  });
});
