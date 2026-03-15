// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Auth identity fields needed to build a composite profile response.
 *
 * Decoupled from Firebase's DecodedIdToken so both API and web can
 * provide these fields from their respective auth contexts.
 */
export interface AuthIdentity {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  picture?: string;
}
