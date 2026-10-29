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

/** Undoes a failed optimistic write unless a newer edit replaced it, and tells the user which. */
export function rollBackFailedWrite({
  isStillShown,
  revert,
  failure,
  reverted,
}: FailedWrite): void {
  const restored = isStillShown();
  if (restored) revert();
  reportRolledBackWrite({ restored, failure, reverted });
}

interface RolledBackWrite extends Pick<FailedWrite, 'failure' | 'reverted'> {
  /** Whether the revert ran, rather than leaving a newer edit in place. */
  restored: boolean;
}

/**
 * Tells the user what a failed optimistic write left showing, for a caller that
 * reverts elsewhere.
 */
export function reportRolledBackWrite({ restored, failure, reverted }: RolledBackWrite): void {
  if (!restored) {
    toast.error(`${failure} Your newer change stands.`);
    return;
  }
  reportFailedWrite(`${failure} ${reverted}`);
}

/** Tells the user a write failed, ending on the next step to take. */
export function reportFailedWrite(failure: string): void {
  toast.error(`${failure} Try again.`);
}
