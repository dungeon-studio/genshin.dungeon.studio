/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

declare const __brand: unique symbol;

/**
 * A string a caller has asserted holds a UUID.
 *
 * The brand records an assertion rather than a check: nothing narrows a string
 * to this type, so every value reaches it through a cast. `randomUUID()` earns
 * one; a path parameter cast at the route boundary does not, and a handler that
 * reads such an identifier has to treat a lookup miss as the validation.
 */
export type UUID = string & { readonly [__brand]: 'UUID' };
