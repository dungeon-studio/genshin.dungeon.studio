// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Loader2 } from 'lucide-react';
import type { JSX } from 'react';

import { Container } from '@/components/chrome/container';

interface LoadingPageProps {
  /** The page's `h1`, kept for screen readers while the content loads. */
  title: string;
  /** What's loading, as a screen reader announces it. */
  label: string;
}

/** A page whose data hasn't loaded, shown in place of defaults a user would read as empty. */
export function LoadingPage({ title, label }: LoadingPageProps): JSX.Element {
  return (
    <Container className="py-12">
      <h1 className="sr-only">{title}</h1>
      <div className="py-24 flex items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden="true"
          focusable={false}
        />
        <span className="sr-only">{label}</span>
      </div>
    </Container>
  );
}
