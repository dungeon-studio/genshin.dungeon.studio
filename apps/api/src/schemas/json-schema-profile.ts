// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * A profile document expressed as a JSON Schema, paired with its serving path.
 *
 * Serves two roles:
 * - **Serving:** The schema route iterates the registry and serves each
 *   entry at its declared path, stamping `$id` with the request origin.
 * - **Validation:** Route handlers pass `entry.schema` to `validateBody`.
 *
 * Satisfies `ProfileLink` from the negotiate-content middleware, so
 * instances can be used directly as the `profile` in a
 * `SupportedRepresentation`.
 */
export interface JsonSchemaProfile {
  /** Absolute URL path where the schema is served (e.g. `/schemas/profile/get-response-v1.json`). */
  readonly path: string;
  /** The JSON Schema object. */
  readonly schema: Record<string, unknown>;
}
