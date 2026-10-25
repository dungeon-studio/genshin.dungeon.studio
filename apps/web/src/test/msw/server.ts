// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/// <reference types="msw/vite/client" />

import { network } from 'virtual:msw';

// Enabled and reset around every test in setup.ts.
export const server = network;
