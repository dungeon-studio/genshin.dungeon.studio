// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { HttpCustomPredicate, PathParams } from 'msw';

/**
 * Matches a request to `url` whose JSON body satisfies `predicate`.
 *
 * Singles out one of several concurrent requests to the same URL, which
 * arrival order can't: concurrent requests reach handlers in any order.
 *
 * msw runs a custom predicate before the handler's method check, so a bodiless
 * request to the same URL, such as a DELETE, reaches it and never matches.
 */
export function matchJsonBody<Body>(
  url: string,
  predicate: (body: Body) => boolean,
): HttpCustomPredicate<PathParams> {
  return async ({ request }) => {
    if (request.url !== url) return false;
    const text = await request.clone().text();
    return text !== '' && predicate(JSON.parse(text) as Body);
  };
}
