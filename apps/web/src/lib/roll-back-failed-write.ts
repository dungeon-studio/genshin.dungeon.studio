// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { toast } from 'sonner';

export interface FailedWrite {
  /** Whether the store still shows the value the failed request sent. */
  isStillShown: () => boolean;
  revert: () => void;
  /** What failed, as a sentence naming the item: "Couldn't remove Furina." */
  failure: string;
  /** What the revert brought back, as a sentence: "Furina is back in your collection." */
  reverted: string;
}

/**
 * Undoes a failed optimistic write and tells the user what happened.
 *
 * The revert runs only while the store still shows the failed value. Once the
 * user has made a newer edit to the same item, that edit stands and the toast
 * says so instead.
 */
export function rollBackFailedWrite({
  isStillShown,
  revert,
  failure,
  reverted,
}: FailedWrite): void {
  if (!isStillShown()) {
    toast.error(`${failure} Your newer change stands.`);
    return;
  }
  revert();
  reportFailedWrite(`${failure} ${reverted}`);
}

/** Tells the user a write failed, ending on the next step to take. */
export function reportFailedWrite(failure: string): void {
  toast.error(`${failure} Try again.`);
}
