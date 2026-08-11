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
 * identifiers that tie a request to a person. `user` is one of them because a
 * decoded Firebase ID token is sensitive whole — uid, email, and the raw claims
 * it was minted from.
 *
 * Deliberately wider than the call sites that exist today: redaction is the net
 * under future logging, not a description of the current one.
 */
const SENSITIVE_KEYS = ['authorization', 'token', 'idToken', 'user', 'uid', 'email'];

/**
 * Every sensitive key at the top level and one below it — a leading `*` matches
 * a single ancestor, so `err.token` and `payload.token` are both covered without
 * naming either. Anything deeper has to be spelled out.
 */
const REDACTED_PATHS = [
  ...SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`]),
  'req.headers.authorization',
];

/** The only things a caller may vary; both exist so tests can read the output. */
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
 * The rest of the configuration is fixed rather than merged from an argument,
 * so redaction cannot be switched off from a call site.
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
