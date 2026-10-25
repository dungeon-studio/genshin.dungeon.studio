// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { HttpCustomPredicate, PathParams } from 'msw';

/**
 * Matches a request to `url` whose JSON body satisfies `predicate`.
 *
 * Singles out one of several concurrent requests to the same URL, which
 * arrival order can't: concurrent requests reach handlers in any order.
 */
export function matchJsonBody<Body>(
  url: string,
  predicate: (body: Body) => boolean,
): HttpCustomPredicate<PathParams> {
  return async ({ request }) =>
    request.url === url && predicate((await request.clone().json()) as Body);
}
