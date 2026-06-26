// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';
import { Outlet } from 'react-router-dom';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Nav } from '@/components/nav';

export function Layout(): JSX.Element {
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
