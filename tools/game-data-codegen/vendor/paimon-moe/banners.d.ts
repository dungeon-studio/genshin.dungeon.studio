// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/** The fields of a paimon-moe banner that debut dates read. */
export interface Banner {
  /** Local time, `YYYY-MM-DD HH:mm:ss`. */
  start: string;
  /** Five-star rate-ups, as paimon-moe's snake_case ids. */
  featured: readonly string[];
  /** Four-star rate-ups, as paimon-moe's snake_case ids. */
  featuredRare: readonly string[];
}

export declare const banners: {
  characters: readonly Banner[];
};
