// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Loader2 } from 'lucide-react';
import type { JSX } from 'react';

import { Container } from '@/components/chrome/container';

interface LoadingPageProps {
  /** The page's heading, kept for screen readers while the content loads. */
  title: string;
  /** What's loading, announced in place of the spinner. */
  label: string;
}

/** A whole page's stand-in while the data it renders loads. */
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
