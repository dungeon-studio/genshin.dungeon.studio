// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Anything with a serving path that can be used as an RFC 6906 profile link.
 * Satisfied by `JsonSchemaProfile` and any future profile-like types.
 */
export interface ProfileLink {
  readonly path: string;
}
