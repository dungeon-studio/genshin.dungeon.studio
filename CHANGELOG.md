<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This project hasn't yet cut its first release, so every entry collects under a
single `### Added` bucket in `[Unreleased]`. Once `0.1.0` ships, later unreleased
changes split into the standard Added, Changed, Deprecated, Removed, Fixed, and
Security sections, since they then describe deltas from a shipped release.

## [Unreleased]

### Added

- Character collection page with compact card tiles, element icons, filters, search, and sort.
- Weapon collection page with ownership tracking and visual distinction between owned and unowned items.
- Prompts to get started when character or weapon collections are empty.
- Team builder as the default landing page with four teams of up to four character slots each.
- Character assignment to team slots from the owned collection.
- Per-character weapon assignment with conflict prevention when a weapon is already equipped on another team.
- Per-character artifact plan configuration with set and affix selection.
- Team composition validation.
- Responsive team editing sheet for small screens.
- Team persistence so compositions survive across sessions.
- Offline collection management that syncs when back online.
- Anonymous-to-authenticated collection merge on sign-in.
- Google sign-in and sign-out from the site header.
- Dark mode support.
- Footer links to GitHub issues, feature requests, discussions, changelog, and repository.
- Game data version displayed in the footer.

[unreleased]: https://github.com/dungeon-studio/genshin.dungeon.studio/commits/develop
