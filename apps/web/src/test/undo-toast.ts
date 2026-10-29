// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { MouseEvent } from 'react';
import { toast } from 'sonner';
import { expect, vi } from 'vitest';

/**
 * Selects Undo on the toast that said `message`, for a test file that mocks
 * `sonner`. Fails the test if no such toast offered one.
 */
export function selectUndo(message: string): void {
  const call = vi.mocked(toast.success).mock.calls.find(([shown]) => shown === message);
  expect(call, `no toast said "${message}"`).toBeDefined();
  const action = call?.[1]?.action;
  if (!action || typeof action !== 'object' || !('onClick' in action)) {
    throw new Error(`"${message}" offered no undo`);
  }
  action.onClick({} as MouseEvent<HTMLButtonElement>);
}
