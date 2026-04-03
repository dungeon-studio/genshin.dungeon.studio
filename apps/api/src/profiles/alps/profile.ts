// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * An ALPS profile document paired with its serving path.
 *
 * Serves two roles:
 * - **Serving:** The profile route iterates the registry and serves each
 *   entry at its declared path.
 * - **Content negotiation:** Route handlers pass entries as the `profile`
 *   in a `SupportedRepresentation`, satisfying `ProfileLink`.
 *
 * Satisfies `ProfileLink` from the profile-link module, so
 * instances can be used directly as the `profile` in a
 * `SupportedRepresentation`.
 */
export interface AlpsProfile {
  /** Absolute URL path where the profile is served (e.g. `/profiles/character/item-v1.json`). */
  readonly path: string;
  /** The ALPS profile document. */
  readonly profile: Record<string, unknown>;
}
