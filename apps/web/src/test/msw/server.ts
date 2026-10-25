// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/// <reference types="msw/vite/client" />

import { network } from 'virtual:msw';

// Shared request-mocking network for the jsdom test environment. Tests register
// per-case handlers with `server.use(...)`; lifecycle is wired in setup.ts.
export const server = network;
