<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Claude Code instructions for genshin.dungeon.studio

Claude Code reads this file and not `AGENTS.md`, so the import below pulls the
repository's agent rules in. Add a rule here only when it's false for every
other agent.

@AGENTS.md

Sessions run on the host, not in the project's container, so pnpm, Firebase
CLI, pre-commit, Vale, REUSE, and Playwright may be absent. Check availability
before relying on a tool; report it as missing rather than failing.
