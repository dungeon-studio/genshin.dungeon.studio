// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WeaponCard } from './weapon-card';

const SWORD = {
  id: 'dull-blade',
  name: 'Dull Blade',
  type: 'Sword' as const,
  rarity: 1 as const,
  baseATK: 23,
  version: '1.0',
};

describe('WeaponCard', () => {
  it('shows the instance count badge when owned', () => {
    render(<WeaponCard weapon={SWORD} instanceCount={3} />);

    expect(screen.getByText('×3')).toBeInTheDocument();
  });

  it('hides the instance count badge when not owned', () => {
    render(<WeaponCard weapon={SWORD} instanceCount={0} />);

    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it('has the correct aria-label', () => {
    render(<WeaponCard weapon={SWORD} instanceCount={2} />);

    expect(screen.getByRole('button', { name: 'Dull Blade, 2 owned' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<WeaponCard weapon={SWORD} instanceCount={1} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledWith('dull-blade');
  });

  it('applies selected ring styles', () => {
    render(<WeaponCard weapon={SWORD} instanceCount={1} selected />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('ring-primary');
  });
});
