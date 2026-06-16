// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Link } from 'react-router-dom';

import { Container } from '@/components/container';

export function NotFoundPage() {
  return (
    <Container className="py-12">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-2xl font-semibold text-foreground">Page Not Found</p>
        <p className="mt-2 text-muted-foreground">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-primary-foreground transition hover:bg-primary/90"
        >
          Back to Teams
        </Link>
      </div>
    </Container>
  );
}
