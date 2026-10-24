// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Identifiers in this workspace that hold a credential or a personal datum.
 * Object shorthand turns a variable name into a log key, so the list names
 * identifiers rather than fields.
 *
 * A decoded Firebase ID token is sensitive whole: its custom claims are an open
 * index signature, so the list names the container `user` rather than its
 * claims.
 *
 * Keep this module free of imports. `eslint.config.js` loads it through Node's
 * type stripping, which resolves neither the `@/` alias nor `.js` specifiers.
 */
export const SENSITIVE_KEYS = ['authorization', 'token', 'idToken', 'user', 'uid', 'email'];
