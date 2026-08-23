<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Claude Code instructions for genshin.dungeon.studio

Claude Code doesn't read `AGENTS.md`, so this file imports it. Add a rule here
only when it's false for every other agent; everything else belongs in
[`AGENTS.md`](AGENTS.md).

@AGENTS.md

## Claude Code only

- Sessions run on the host, not in the project's container, so pnpm, Firebase
  CLI, pre-commit, Vale, REUSE, and Playwright may be absent. Check
  availability before relying on a tool; report it as missing rather than
  failing.
