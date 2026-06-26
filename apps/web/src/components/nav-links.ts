// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export interface NavLinkItem {
  to: string;
  label: string;
}

export const NAV_LINKS: readonly NavLinkItem[] = [
  { to: '/', label: 'Teams' },
  { to: '/characters', label: 'Characters' },
  { to: '/weapons', label: 'Weapons' },
];
