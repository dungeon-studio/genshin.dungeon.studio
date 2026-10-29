// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { toast } from 'sonner';

/** Longer than the default, since the toast carries an action. */
const UNDO_TOAST_DURATION_MS = 10_000;

/** Closed toasts stay until sign-out, since dismissing one is harmless. */
const offers = new Set<string | number>();

/**
 * Confirms a destructive write and offers to reverse it.
 *
 * `confirmation` names what was lost: "Removed Furina at constellation level 2."
 */
export function offerUndo(confirmation: string, undo: () => void): void {
  offers.add(
    toast.success(confirmation, {
      action: { label: 'Undo', onClick: undo },
      duration: UNDO_TOAST_DURATION_MS,
    }),
  );
}

/** Call on sign-out, so an undo can't write into the next account's data. */
export function withdrawUndoOffers(): void {
  for (const id of offers) toast.dismiss(id);
  offers.clear();
}
