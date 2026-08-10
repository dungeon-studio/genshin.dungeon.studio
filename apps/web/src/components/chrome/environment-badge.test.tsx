// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EnvironmentBadge } from './environment-badge';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('EnvironmentBadge', () => {
  it.each([
    { appEnv: 'dev', label: 'ALPHA' },
    { appEnv: 'staging', label: 'BETA' },
  ])('names the $appEnv deployment', ({ appEnv, label }) => {
    vi.stubEnv('VITE_APP_ENV', appEnv);

    render(<EnvironmentBadge />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('stays out of the header in production', () => {
    vi.stubEnv('VITE_APP_ENV', 'prod');

    const { container } = render(<EnvironmentBadge />);

    expect(container).toBeEmptyDOMElement();
  });
});
