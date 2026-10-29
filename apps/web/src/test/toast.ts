// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Action } from 'sonner';
import { toast } from 'sonner';
import { vi } from 'vitest';

function clickLastAction(kind: 'error' | 'success'): void {
  const action = vi.mocked(toast[kind]).mock.lastCall?.[1]?.action as Action | undefined;
  action?.onClick(new MouseEvent('click') as unknown as ReactMouseEvent<HTMLButtonElement>);
}

/** Clicks the most recent error toast's action button, if it has one; needs `sonner` mocked. */
export function clickErrorToastAction(): void {
  clickLastAction('error');
}

/** Clicks the most recent success toast's action button, if it has one; needs `sonner` mocked. */
export function clickSuccessToastAction(): void {
  clickLastAction('success');
}
