// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Loader2 } from 'lucide-react';
import type { JSX } from 'react';

import { Container } from '@/components/chrome/container';

interface LoadingPageProps {
  /** The page heading, visible only to screen readers. */
  title: string;
  /** Screen-reader text naming what's loading. */
  label: string;
}

/** Renders its own container and heading, so a page returns it in place of its content. */
function LoadingPage({ title, label }: LoadingPageProps): JSX.Element {
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

export { LoadingPage };
