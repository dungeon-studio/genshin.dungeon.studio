/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { ISOTimestamp } from './isoTimestamp.js';

/**
 * User represents a Genshin Impact player authenticated via OIDC
 */
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
  provider: string;
  providerUserId: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}
