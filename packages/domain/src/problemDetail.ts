// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Problem Details for HTTP APIs — strict project subset of RFC 9457.
 *
 * This interface requires fields that RFC 9457 leaves optional. The shape
 * will be reassessed when content negotiation and representation parsing
 * are implemented (see #518, #520).
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
export interface ProblemDetail {
  /** A URI reference identifying the problem type. Defaults to "about:blank" when omitted. */
  type?: string;
  /** A short, human-readable summary of the problem type. */
  title: string;
  /** The HTTP status code. */
  status: number;
  /** A human-readable explanation specific to this occurrence. */
  detail: string;
  /** A URI reference identifying the specific occurrence. */
  instance?: string;
}
