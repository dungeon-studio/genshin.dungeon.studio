// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { MouseEvent } from 'react';
import type { Action } from 'sonner';
import { toast } from 'sonner';
import { expect, vi } from 'vitest';

/** Selects Undo on the toast that said `message`, for a test file that mocks `sonner`. */
export function selectUndo(message: string): void {
  const options = vi.mocked(toast.success).mock.calls.find(([shown]) => shown === message)?.[1];
  expect(options?.action, `no undo on "${message}"`).toMatchObject({ label: 'Undo' });
  (options?.action as Action).onClick({} as MouseEvent<HTMLButtonElement>);
}
