// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { MouseEvent as ReactMouseEvent } from 'react';
import { toast } from 'sonner';
import { vi } from 'vitest';

/** Clicks the action button on the most recent error toast; needs `sonner` mocked. */
export function clickErrorToastAction(): void {
  const action = vi.mocked(toast.error).mock.lastCall?.[1]?.action;
  if (typeof action !== 'object' || action === null || !('onClick' in action)) {
    throw new Error('The error toast carries no action');
  }
  action.onClick(new MouseEvent('click') as unknown as ReactMouseEvent<HTMLButtonElement>);
}
