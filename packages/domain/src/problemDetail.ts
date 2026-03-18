// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * RFC 9457 Problem Details for HTTP APIs.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
export interface ProblemDetail {
  /** A URI reference identifying the problem type. Defaults to "about:blank". */
  type: string;
  /** A short, human-readable summary of the problem type. */
  title: string;
  /** The HTTP status code. */
  status: number;
  /** A human-readable explanation specific to this occurrence. */
  detail: string;
  /** A URI reference identifying the specific occurrence. */
  instance?: string;
}
