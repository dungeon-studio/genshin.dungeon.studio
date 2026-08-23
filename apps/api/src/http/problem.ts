// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ProblemDetail } from '@genshin/domain';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { retryAfterSeconds } from './retry-after.js';

/** RFC 9457's type for a problem with no classification beyond its status. */
export const ABOUT_BLANK = 'about:blank';

/**
 * The `detail` for any failure a client cannot act on, uniform across origins
 * so a response never discloses which subsystem broke.
 */
export const INTERNAL_ERROR_DETAIL = 'An unexpected error occurred';

export type ProblemOptions = {
  type: string;
  /** Serialised as the problem document's `detail`. */
  message: string;
};

/**
 * An HTTP error carrying an RFC 9457 problem type URI.
 *
 * RFC 9457 makes `type` the classifier clients branch on and `detail` merely
 * supplementary, so a thrower that knows its failure mode records it here. The
 * error handler serialises it; a plain `HTTPException` gets `about:blank`.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457#name-type
 */
export class ProblemException extends HTTPException {
  readonly type: string;

  constructor(status: ContentfulStatusCode, options: ProblemOptions) {
    super(status, { message: options.message });
    this.type = options.type;
  }
}

/** How an error classifies, which is `about:blank` unless it says otherwise. */
export function problemTypeOf(err: unknown): string {
  return err instanceof ProblemException ? err.type : ABOUT_BLANK;
}

/** `ProblemDetail` with the status type Hono requires of a response with a body. */
type ProblemPayload = Omit<ProblemDetail, 'status'> & { status: ContentfulStatusCode };

/**
 * The HTTP response carrying a problem document.
 *
 * Uses `c.body()`, not `c.json()`: handed a `ResponseInit`, `c.json()` overwrites
 * the Content-Type it carried with `application/json`, which would leave a client
 * unable to tell an error from a success.
 */
export function problemResponse(c: Context, problem: ProblemPayload): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/problem+json' };
  const retryAfter = retryAfterSeconds(problem.status);
  if (retryAfter !== undefined) headers['Retry-After'] = String(retryAfter);

  return c.body(JSON.stringify(problem), { status: problem.status, headers });
}
