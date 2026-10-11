// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { DestinationStream, Logger, LoggerOptions } from 'pino';
import { pino, stdSerializers } from 'pino';

import { SENSITIVE_KEYS } from '@/sensitive-keys.js';

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

/** What both mechanisms below put in place of a value they remove. */
const CENSOR = '[Redacted]';

/**
 * A leading `*` matches one ancestor, so each key is covered at the top level
 * and one below — enough to reach `err.token` without naming `err`. Deeper
 * paths are spelled out. The `redacted-log-keys` lint rule assumes this depth.
 */
const REDACTED_PATHS = [
  ...SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`]),
  'req.headers.authorization',
];

/**
 * The three base64url segments of a JWT, which is what this API accepts as a
 * bearer credential.
 */
const JWT_PATTERN = /eyJ[\w-]+\.[\w-]+\.[\w-]*/g;

/**
 * Errors are logged whole, and an upstream is free to quote the credential that
 * provoked it into its own message or stack. Paths cannot reach inside a
 * string, so the token is matched by shape there instead.
 *
 * Only `err` is scanned. A credential reaching a log line as some other free
 * text is not covered by either mechanism.
 */
function serialiseError(error: unknown): unknown {
  if (!(error instanceof Error)) return error;

  const serialised = stdSerializers.err(error);
  return {
    ...serialised,
    message: serialised.message.replace(JWT_PATTERN, CENSOR),
    stack: serialised.stack.replace(JWT_PATTERN, CENSOR),
  };
}

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
      redact: { paths: REDACTED_PATHS, censor: CENSOR },
      serializers: { err: serialiseError },
    },
    destination,
  );
}

/**
 * The process-wide logger. Request handlers should prefer the request-scoped
 * child on the Hono context, which carries the method and path.
 */
export const logger = createLogger();
