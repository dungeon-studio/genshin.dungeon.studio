// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { LogIn } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';

import { signInWithGoogle } from './sign-in';

export function LoginButton(): JSX.Element {
  return (
    <Button type="button" onClick={signInWithGoogle} variant="outline">
      <LogIn aria-hidden="true" focusable={false} className="h-4 w-4" />
      Sign in
    </Button>
  );
}
