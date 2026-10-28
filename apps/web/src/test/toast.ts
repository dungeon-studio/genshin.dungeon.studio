// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Action } from 'sonner';
import { toast } from 'sonner';
import { vi } from 'vitest';

/** Clicks the most recent error toast's action button, if it has one; needs `sonner` mocked. */
export function clickErrorToastAction(): void {
  const action = vi.mocked(toast.error).mock.lastCall?.[1]?.action as Action | undefined;
  action?.onClick(new MouseEvent('click') as unknown as ReactMouseEvent<HTMLButtonElement>);
}
