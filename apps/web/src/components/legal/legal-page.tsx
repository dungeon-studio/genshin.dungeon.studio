// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX, ReactNode } from 'react';

import { Container } from '@/components/chrome/container';

export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <Container className="max-w-3xl py-12">
      <article className="text-muted-foreground">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground/70">Effective {effectiveDate}</p>
        {children}
      </article>
    </Container>
  );
}

export function LegalHeading({ children }: { children: ReactNode }): JSX.Element {
  return <h2 className="mt-8 text-xl font-semibold text-foreground">{children}</h2>;
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <>
      <LegalHeading>{title}</LegalHeading>
      <p className="mt-4 leading-relaxed">{children}</p>
    </>
  );
}
