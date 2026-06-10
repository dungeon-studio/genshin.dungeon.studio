// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfilePage } from './profile-page';
import { useProfileQuery, useUpdateProfileMutation } from './use-profile';

vi.mock('@/lib/firebase', () => ({ auth: {} }));
vi.mock('./use-profile');

const mockedUseProfileQuery = vi.mocked(useProfileQuery);
const mockedUseUpdateProfileMutation = vi.mocked(useUpdateProfileMutation);

const PROFILE = {
  uid: 'user-123',
  email: 'traveler@example.com',
  emailVerified: true,
  picture: 'https://example.com/avatar.png',
  name: 'Traveler',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function mockQuery(value: { data?: typeof PROFILE; isLoading?: boolean; error?: Error | null }) {
  mockedUseProfileQuery.mockReturnValue({
    data: value.data,
    isLoading: value.isLoading ?? false,
    error: value.error ?? null,
  } as unknown as ReturnType<typeof useProfileQuery>);
}

function mockMutation(value: { mutate?: () => void; isPending?: boolean; isError?: boolean }) {
  const mutate = value.mutate ?? vi.fn();
  mockedUseUpdateProfileMutation.mockReturnValue({
    mutate,
    isPending: value.isPending ?? false,
    isError: value.isError ?? false,
  } as unknown as ReturnType<typeof useUpdateProfileMutation>);
  return mutate;
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutation({});
  });

  it('shows a loading indicator while the profile loads', () => {
    mockQuery({ isLoading: true });

    render(<ProfilePage />);

    expect(screen.getByText('Loading profile')).toBeInTheDocument();
  });

  it('shows an error message when the profile fails to load', () => {
    mockQuery({ error: new Error('boom') });

    render(<ProfilePage />);

    expect(screen.getByText(/failed to load your profile/i)).toBeInTheDocument();
  });

  it('renders the name, email, verification state, and avatar', () => {
    mockQuery({ data: PROFILE });

    const { container } = render(<ProfilePage />);

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText('Traveler')).toBeInTheDocument();
    expect(screen.getByText(/traveler@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/Verified/)).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', PROFILE.picture);
  });

  it('disables Save until the display name changes', async () => {
    mockQuery({ data: PROFILE });

    render(<ProfilePage />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Display name'), '!');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('submits the trimmed display name via the update mutation', async () => {
    const mutate = mockMutation({});
    mockQuery({ data: PROFILE });

    render(<ProfilePage />);

    const input = screen.getByLabelText('Display name');
    await userEvent.clear(input);
    await userEvent.type(input, '  Paimon  ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mutate).toHaveBeenCalledWith({ name: 'Paimon' });
  });
});
