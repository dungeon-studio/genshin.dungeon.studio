// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX, ReactNode } from 'react';
import { Link } from 'react-router-dom';

const PRIVACY_EMAIL = 'privacy@dungeon.studio';

const LINK_CLASS = 'text-foreground underline underline-offset-4 hover:no-underline';

export function InternalLegalLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <Link to={to} className={LINK_CLASS}>
      {children}
    </Link>
  );
}

export function ExternalLegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      {children}
    </a>
  );
}

export function PrivacyEmailLink(): JSX.Element {
  return (
    <a href={`mailto:${PRIVACY_EMAIL}`} className={LINK_CLASS}>
      {PRIVACY_EMAIL}
    </a>
  );
}
