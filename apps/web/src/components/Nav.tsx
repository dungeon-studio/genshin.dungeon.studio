// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { NavLink } from 'react-router-dom';

export function Nav() {
  const navLinks = [
    { to: '/', label: 'Teams' },
    { to: '/characters', label: 'Characters' },
    { to: '/weapons', label: 'Weapons' },
    { to: '/chat', label: 'Chat' },
  ];

  return (
    <nav className="border-b border-border bg-muted" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `inline-block border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-blue-500 hover:text-foreground'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
