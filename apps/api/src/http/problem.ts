// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

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

  constructor(status: ContentfulStatusCode, options: { type: string; message: string }) {
    super(status, { message: options.message });
    this.type = options.type;
  }
}
