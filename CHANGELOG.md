<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This project hasn't yet cut its first release, so every entry collects under a
single `### Added` bucket in `[Unreleased]`.

## [Unreleased]

### Added

- Character collection page with compact card tiles, element icons, filters, search, and sort.
- Weapon collection page with ownership tracking and visual distinction between owned and unowned items.
- Prompts to get started when character or weapon collections are empty, including on the team builder landing page.
- Team builder as the default landing page with four teams of up to four character slots each.
- Character assignment to team slots from the owned collection.
- Per-character weapon assignment with conflict prevention when a weapon is already equipped on another team.
- Holder names on weapons equipped by another team, with a hint on an empty slot to pick that character first.
- Per-character artifact plan configuration with set and affix selection.
- Team composition validation.
- Elemental resonance badges on full teams; tapping one shows its bonus.
- Responsive team editing sheet for small screens.
- Phone-width layout for the header and team slots.
- Team persistence so compositions survive across sessions.
- Collections saved to your account, with a sign-in prompt when managing one signed out.
- Save-failure messages that name the team, character, or weapon, say what was put back, and suggest trying again.
- Undo for removing a character or weapon copy, restoring its constellation level or refinement rank.
- Google sign-in and sign-out from the site header.
- Messages when sign-in or sign-out fails, such as a blocked pop-up, with a button to try again.
- Dark mode support.
- Footer links to GitHub issues, feature requests, discussions, changelog, and repository.
- Game data version displayed in the footer.

[unreleased]: https://github.com/dungeon-studio/genshin.dungeon.studio/commits/develop
