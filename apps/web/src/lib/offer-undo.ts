// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { toast } from 'sonner';

/** Confirms a destructive action with a toast whose button reverses it. */
export function offerUndo(done: string, undo: () => void): void {
  toast.success(done, { action: { label: 'Undo', onClick: undo } });
}
