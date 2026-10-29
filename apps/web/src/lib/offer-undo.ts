// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { toast } from 'sonner';

/** Longer than the default, since the toast carries an action. */
const UNDO_TOAST_DURATION_MS = 10_000;

const openOffers = new Set<string | number>();

/** Confirms a destructive write and offers to reverse it: "Removed Furina." */
export function offerUndo(done: string, undo: () => void): void {
  const id = toast.success(done, {
    action: {
      label: 'Undo',
      onClick: () => {
        openOffers.delete(id);
        undo();
      },
    },
    duration: UNDO_TOAST_DURATION_MS,
    onDismiss: () => openOffers.delete(id),
    onAutoClose: () => openOffers.delete(id),
  });
  openOffers.add(id);
}

/**
 * Withdraws every open offer, so an undo clicked after sign-out can't write
 * into the next account's data.
 */
export function withdrawUndoOffers(): void {
  for (const id of openOffers) toast.dismiss(id);
  openOffers.clear();
}
