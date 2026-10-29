// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type * as FirebaseAuth from '@firebase/auth';
import { signInWithPopup } from '@firebase/auth';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Users } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { SignInPrompt } from './sign-in-prompt';

vi.mock('@firebase/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseAuth>()),
  signInWithPopup: vi.fn(),
}));

describe('SignInPrompt', () => {
  it('opens Google sign-in from its button', async () => {
    const user = userEvent.setup();
    render(
      <SignInPrompt
        icon={Users}
        title="Sign in to build teams"
        description="Saved to your account."
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(signInWithPopup).toHaveBeenCalledOnce();
  });
});
