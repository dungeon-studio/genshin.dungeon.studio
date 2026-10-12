// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactPlan } from '@genshin/domain';
import { ARTIFACT_SETS } from '@genshin/game-data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { assert, beforeAll, describe, expect, it, vi } from 'vitest';

import { ArtifactPlanner } from './artifact-planner';

// Radix Popover and cmdk rely on pointer-capture and scroll APIs that jsdom
// does not implement; stub them so the set-search combobox can open.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});

function Harness({ initial }: { initial?: ArtifactPlan }): React.JSX.Element {
  const [plan, setPlan] = useState<ArtifactPlan | undefined>(initial);
  return <ArtifactPlanner plan={plan} onChange={setPlan} />;
}

function substatNames(listLabel: string): string[] {
  const list = screen.getByRole('list', { name: listLabel });
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent.trim());
}

describe('ArtifactPlanner', () => {
  it('records a selected main affix for each piece', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const sands = screen.getByLabelText('Sands of Eon');
    const goblet = screen.getByLabelText('Goblet of Eonothem');
    const circlet = screen.getByLabelText('Circlet of Logos');

    await user.selectOptions(sands, 'Energy Recharge');
    await user.selectOptions(goblet, 'Elemental Mastery');
    await user.selectOptions(circlet, 'CRIT Rate');

    expect(sands).toHaveValue('Energy Recharge');
    expect(goblet).toHaveValue('Elemental Mastery');
    expect(circlet).toHaveValue('CRIT Rate');
  });

  it('clears a main affix when the empty option is chosen', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ sands: 'Energy Recharge' }} />);

    const sands = screen.getByLabelText('Sands of Eon');
    expect(sands).toHaveValue('Energy Recharge');

    await user.selectOptions(sands, '');

    expect(sands).toHaveValue('');
  });

  it('orders selected substats canonically regardless of add order', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // Add out of canonical order: CRIT DMG is last, HP is first.
    await user.selectOptions(screen.getByLabelText('Add priority substats'), 'CRIT DMG');
    await user.selectOptions(screen.getByLabelText('Add priority substats'), 'HP');

    expect(substatNames('Priority substats')).toEqual(['HP', 'CRIT DMG']);
  });

  it('excludes affixes already chosen in the other list', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(screen.getByLabelText('Add priority substats'), 'CRIT Rate');

    const secondaryAdd = screen.getByLabelText('Add secondary substats');
    expect(
      within(secondaryAdd).queryByRole('option', { name: 'CRIT Rate' }),
    ).not.toBeInTheDocument();
  });

  it('stops offering more substats once the list is full', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    for (const affix of ['HP', 'ATK', 'DEF']) {
      await user.selectOptions(screen.getByLabelText('Add priority substats'), affix);
    }

    expect(substatNames('Priority substats')).toHaveLength(3);
    expect(screen.queryByLabelText('Add priority substats')).not.toBeInTheDocument();
  });

  it('removes a selected substat', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ priorityMinorAffixes: ['HP', 'CRIT DMG'] }} />);

    await user.click(screen.getByRole('button', { name: 'Remove HP' }));

    expect(substatNames('Priority substats')).toEqual(['CRIT DMG']);
  });

  it('keeps priority and secondary lists independent', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(screen.getByLabelText('Add priority substats'), 'CRIT Rate');
    await user.selectOptions(screen.getByLabelText('Add secondary substats'), 'Energy Recharge');

    expect(substatNames('Priority substats')).toEqual(['CRIT Rate']);
    expect(substatNames('Secondary substats')).toEqual(['Energy Recharge']);
  });

  const obsidianCodex = ARTIFACT_SETS['obsidian-codex'];
  const unfinishedReverie = ARTIFACT_SETS['unfinished-reverie'];

  // Opening the set popover mounts the full roster, so each test opens it at
  // most once.
  it('selects a first artifact set', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Harness />);

    await user.click(screen.getByRole('combobox', { name: 'Search artifact set...' }));
    await user.click(await screen.findByRole('option', { name: obsidianCodex.name }));

    expect(screen.getByText(obsidianCodex.name)).toBeInTheDocument();
  });

  it('selects a second artifact set once a first is chosen', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Harness initial={{ sets: [obsidianCodex.id] }} />);

    await user.click(screen.getByRole('combobox', { name: 'Optional second 2-piece set...' }));
    await user.click(await screen.findByRole('option', { name: unfinishedReverie.name }));

    expect(screen.getByText(obsidianCodex.name)).toBeInTheDocument();
    expect(screen.getByText(unfinishedReverie.name)).toBeInTheDocument();
  });

  it('clears both artifact sets when the first is cleared', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ sets: [obsidianCodex.id, unfinishedReverie.id] }} />);

    const [clearFirst] = screen.getAllByRole('button', { name: 'Clear selection' });
    assert.isDefined(clearFirst);
    await user.click(clearFirst);

    expect(screen.queryByText(obsidianCodex.name)).not.toBeInTheDocument();
    expect(screen.queryByText(unfinishedReverie.name)).not.toBeInTheDocument();
  });
});
