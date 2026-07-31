// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Seconds a client should wait before retrying each status that carries retry
// semantics, for the RFC 9110 Retry-After header. Quota exhaustion (429)
// recovers over a wider window than transient unavailability (503). Statuses
// absent here have no retry semantics and get no Retry-After.
const RETRY_AFTER_SECONDS: Partial<Record<ContentfulStatusCode, number>> = {
  429: 30,
  503: 5,
};

// Retry-After value for an error response, keyed on its status alone, or
// undefined when the status carries no retry semantics.
export function retryAfterSeconds(status: ContentfulStatusCode): number | undefined {
  return RETRY_AFTER_SECONDS[status];
}
