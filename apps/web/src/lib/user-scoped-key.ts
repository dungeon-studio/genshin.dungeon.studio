// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Build the query key function for a user-scoped collection.
 *
 * A function rather than a key because `invalidateUserQuery` accepts a
 * signed-out `userId`, and so has nothing to key until it knows there is one.
 */
export function userScopedKey(scope: string): (userId: string) => readonly [string, string] {
  return (userId) => [scope, userId] as const;
}
