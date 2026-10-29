// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { HttpCustomPredicate, PathParams } from 'msw';

/**
 * Picks out one of several concurrent requests to the same URL, which can
 * reach handlers in any order.
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
