// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Hono } from 'hono';

import { deleteUser } from '@/firebase/auth.js';
import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import type { RequestLogVariables } from '@/middleware/log-request.js';
import * as Account from '@/repositories/account/index.js';

/**
 * The signed-in caller's account: the identity plus everything the service
 * stores for it. One per caller, so the path is singular and carries no
 * identifier — the verified token names the account.
 *
 * It answers no `GET`; there is nothing to fetch.
 */
export const account = new Hono<{
  Variables: AuthVariables & RequestLogVariables;
}>();

account.use('*', auth);

// DELETE /account — Erase the caller's data and identity
account.delete('/', async (c) => {
  const userId = c.get('user').uid;

  // Stored data first: a failure between the two leaves a signed-in user who
  // can ask again, where the reverse strands data with nobody left to ask.
  await Account.eraseStoredData(userId);
  await deleteUser(userId);

  return c.body(null, 204);
});
