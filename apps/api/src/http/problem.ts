// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** The RFC 9457 type for a problem carrying no classification beyond its status. */
export const ABOUT_BLANK = 'about:blank';

/** The classification and human-readable message of a problem. */
export type ProblemOptions = {
  /** URI reference identifying the problem type. */
  type: string;
  /** Human-readable explanation, serialised as the problem document's `detail`. */
  message: string;
};

/**
 * An HTTP error carrying an RFC 9457 problem type URI.
 *
 * RFC 9457 makes `type` the primary classifier and `detail` supplementary, so
 * a thrower that knows which failure mode it hit reports it here rather than
 * only in the human-readable message. The error handler serialises `type` into
 * the problem document; a plain `HTTPException` classifies as `about:blank`.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457#name-type
 */
export class ProblemException extends HTTPException {
  /** URI reference identifying the problem type. */
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
