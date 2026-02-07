// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Link, NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
          Genshin Team Builder
        </Link>
      </div>
    </header>
  );
}

function Nav() {
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/collection', label: 'Collection' },
    { to: '/teams', label: 'Teams' },
    { to: '/chat', label: 'Chat' },
  ];

  return (
    <nav className="border-b border-gray-200 bg-gray-50" aria-label="Main navigation">
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
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-600 hover:border-blue-500 hover:text-gray-900'
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

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-600">
        <p>Built with React 19 + TypeScript + Vite</p>
        <p className="mt-2 text-xs text-gray-500">© 2026 Genshin Team Builder</p>
      </div>
    </footer>
  );
}
