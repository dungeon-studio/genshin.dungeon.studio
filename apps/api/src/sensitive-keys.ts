// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Identifiers in this workspace that hold a credential or a personal datum,
 * since object shorthand turns a variable name into a log key. The logger
 * redacts them, and `eslint.config.js` rejects log calls that read one into a
 * key the redaction cannot reach.
 *
 * A decoded Firebase ID token is sensitive whole — its custom claims are an
 * open index signature, so naming its fields could never be complete — which is
 * why `user`, the container, is on the list rather than the claims inside it.
 *
 * Imported by `eslint.config.js` through Node's type stripping, so this module
 * imports nothing.
 */
export const SENSITIVE_KEYS = ['authorization', 'token', 'idToken', 'user', 'uid', 'email'];
