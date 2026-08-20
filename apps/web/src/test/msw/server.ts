// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { setupServer } from 'msw/node';

// Shared request-mocking server for the jsdom test environment. Tests register
// per-case handlers with `server.use(...)`; lifecycle is wired in setup.ts.
export const server = setupServer();
