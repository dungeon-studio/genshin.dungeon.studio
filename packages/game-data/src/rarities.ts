// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * A star rating, shared by every kind of game item so a renderer draws them all
 * the same way.
 *
 * Spans the game's full range, which no catalogue in this package fills, so a
 * caller building a filter from this type offers ratings nothing matches.
 */
export type Rarity = 1 | 2 | 3 | 4 | 5;
