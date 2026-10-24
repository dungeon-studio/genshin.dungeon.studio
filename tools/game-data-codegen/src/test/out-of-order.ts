// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/** The entries `inOrder` rejects after their predecessor, so a failure names them. */
export function outOfOrder<T>(
  items: readonly T[],
  inOrder: (previous: T, current: T) => boolean,
): T[] {
  return items.slice(1).filter((current, index) => {
    const previous = items[index];
    return previous !== undefined && !inOrder(previous, current);
  });
}
