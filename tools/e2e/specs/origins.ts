// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Where the development stack listens.
 *
 * Ports match apps/api/src/main.ts and vite.config.ts. The host has to be
 * `localhost`, not 127.0.0.1: Firebase's popup sign-in returns the credential
 * to the origin that opened it, and the emulator serves its handler from
 * localhost. These are also the API's default CORS origin and the app's default
 * API base URL, so neither server needs configuring for them.
 */
export const LOCAL_WEB_ORIGIN = 'http://localhost:5173';
export const LOCAL_API_ORIGIN = 'http://localhost:8080';
