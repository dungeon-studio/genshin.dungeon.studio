// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Build the TanStack Query key function for a user-scoped collection. Every
 * collection keys its cache by scope then user, so the scope is all that
 * varies, and the result is the `keyFor` that `invalidateUserQuery` wants.
 */
export function userScopedKey(scope: string): (userId: string) => readonly [string, string] {
  return (userId) => [scope, userId] as const;
}
