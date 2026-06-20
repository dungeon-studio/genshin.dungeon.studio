// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { NavLink } from 'react-router-dom';

import { Container } from '@/components/container';
import { NAV_LINKS } from '@/components/nav-links';

export function Nav() {
  return (
    <nav className="hidden border-b border-border bg-muted sm:block" aria-label="Main navigation">
      <Container>
        <div className="flex gap-8">
          {NAV_LINKS.map((link) => (
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
      </Container>
    </nav>
  );
}
