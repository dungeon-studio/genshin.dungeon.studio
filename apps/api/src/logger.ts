// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { DestinationStream, Logger, LoggerOptions } from 'pino';
import { pino } from 'pino';

/**
 * Cloud Logging takes the level from a `severity` field naming a `LogSeverity`;
 * pino's numeric `level` is not one.
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
 * Keys that carry a credential or identify a person. A decoded Firebase ID
 * token is sensitive whole, so `user` covers the uid, email, and claims it was
 * minted from.
 */
const SENSITIVE_KEYS = ['authorization', 'token', 'idToken', 'user', 'uid', 'email'];

/**
 * A leading `*` matches one ancestor, so each key is covered at the top level
 * and one below — enough to reach `err.token` without naming `err`. Deeper
 * paths are spelled out.
 */
const REDACTED_PATHS = [
  ...SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`]),
  'req.headers.authorization',
];

interface LoggerSettings {
  /** Takes precedence over `LOG_LEVEL`. */
  level?: LoggerOptions['level'];
  /** Where lines are written. Defaults to stdout. */
  destination?: DestinationStream;
}

/**
 * Build a logger emitting single-line JSON that Cloud Logging and Loki both
 * read: `severity` for the level, `message` for the text, ISO-8601 `time`.
 *
 * Only the level and destination are adjustable, so redaction cannot be
 * switched off from a call site.
 */
export function createLogger({ level, destination }: LoggerSettings = {}): Logger {
  return pino(
    {
      level: level ?? process.env.LOG_LEVEL ?? 'info',
      messageKey: 'message',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label, number) => ({
          severity: SEVERITY_BY_LEVEL[label] ?? 'DEFAULT',
          level: number,
        }),
      },
      redact: { paths: REDACTED_PATHS },
    },
    destination,
  );
}

/**
 * The process-wide logger. Request handlers should prefer the request-scoped
 * child on the Hono context, which carries the method and path.
 */
export const logger = createLogger();
