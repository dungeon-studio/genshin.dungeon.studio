/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

declare const __brand: unique symbol;

export type UUID = string & { readonly [__brand]: 'UUID' };
