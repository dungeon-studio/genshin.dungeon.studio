// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export interface Deferred {
  promise: Promise<void>;
  release: () => void;
}

/** A promise a test settles by hand, to hold a mock request open. */
export function deferred(): Deferred {
  let release: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
