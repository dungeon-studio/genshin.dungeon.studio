// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** RFC 9457's type for a problem with no classification beyond its status. */
export const ABOUT_BLANK = 'about:blank';

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
