// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { Container } from '@/components/chrome/container';
import { Button } from '@/components/ui/button';

interface LoadFailedPageProps {
  /** The page's `h1`, kept for screen readers in place of the content. */
  title: string;
  /** The sentence shown, naming what failed in the user's terms. */
  message: string;
  onRetry: () => void;
}

/** A page whose data failed to load, shown in place of defaults a user would read as empty. */
export function LoadFailedPage({ title, message, onRetry }: LoadFailedPageProps): JSX.Element {
  return (
    <Container className="py-12">
      <h1 className="sr-only">{title}</h1>
      <div className="gap-4 py-24 flex flex-col items-center text-center">
        <p className="text-sm text-destructive">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </Container>
  );
}
