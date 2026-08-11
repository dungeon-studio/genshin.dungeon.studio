// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { DestinationStream, Logger, LoggerOptions } from 'pino';
import { pino } from 'pino';

/**
 * Cloud Logging reads `severity` from the JSON payload and rejects pino's
 * numeric levels, so every level maps onto a `LogSeverity` name.
 *
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
 */
const SEVERITY_BY_LEVEL: Record<string, string> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

/**
 * Keys whose values never reach a log sink: bearer credentials, and the
 * identifiers that tie a request to a person.
 *
 * The list is deliberately wider than the call sites that exist today —
 * redaction is the net under future logging, not a description of the current
 * one. A leading `*` matches any single ancestor key, so `err.token` and
 * `payload.token` are both covered without naming either.
 */
const REDACTED_PATHS = [
  'authorization',
  '*.authorization',
  'req.headers.authorization',
  'token',
  '*.token',
  'idToken',
  '*.idToken',
  // A decoded Firebase ID token is sensitive whole: uid, email, and the raw
  // claims it was minted from.
  'user',
  '*.user',
  'uid',
  '*.uid',
  'email',
  '*.email',
];

/**
 * Build a logger emitting single-line JSON that Cloud Logging and Loki both
 * read: `severity` for the level, `message` for the text, ISO-8601 `time`.
 *
 * @param overrides - pino options replacing the defaults; for tests.
 * @param destination - where lines are written, stdout when omitted.
 */
export function createLogger(
  overrides: LoggerOptions = {},
  destination?: DestinationStream,
): Logger {
  return pino(
    {
      level: process.env.LOG_LEVEL ?? 'info',
      messageKey: 'message',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label, number) => ({
          severity: SEVERITY_BY_LEVEL[label] ?? 'DEFAULT',
          level: number,
        }),
      },
      redact: { paths: REDACTED_PATHS },
      ...overrides,
    },
    destination,
  );
}

/**
 * The process-wide logger. Request handlers should prefer the request-scoped
 * child on the Hono context, which carries the method and path.
 */
export const logger = createLogger();
