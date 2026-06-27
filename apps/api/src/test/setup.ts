// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import fc from 'fast-check';

// Pin the fast-check seed so property-test failures reproduce identically on
// every run, locally and in CI. fast-check prints the seed on failure; fixing
// it up front means a CI failure replays deterministically without first
// hunting for the seed from the logs.
fc.configureGlobal({ seed: 0x9e3779b1 });
