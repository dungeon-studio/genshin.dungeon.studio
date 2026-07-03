// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Draft terms describing the service as of HEAD. Needs a legal review pass
// and a dedicated contact address before the 1.0.0 tag; see #647.

import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import { Container } from '@/components/container';

const EFFECTIVE_DATE = '3 July 2026';
const GITHUB_REPO = 'https://github.com/dungeon-studio/genshin.dungeon.studio';

export function TermsOfServicePage(): JSX.Element {
  return (
    <Container className="max-w-3xl py-12">
      <article className="text-muted-foreground">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground/70">Effective {EFFECTIVE_DATE}</p>

        <p className="mt-6 leading-relaxed">
          By using genshin.dungeon.studio you agree to these terms. If you don't agree, please don't
          use the app.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">The service</h2>
        <p className="mt-4 leading-relaxed">
          genshin.dungeon.studio is a free, unofficial team-building companion for Genshin Impact.
          It helps you track your collection and plan teams. It is provided at no cost and with no
          guarantee of continued availability.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">
          Not affiliated with HoYoverse
        </h2>
        <p className="mt-4 leading-relaxed">
          This is a fan-made project. It is not affiliated with, endorsed by, or sponsored by
          HoYoverse (miHoYo/Cognosphere). Genshin Impact and all related names, characters, and art
          are trademarks and copyright of their respective owners. Game data is presented for
          reference and may be inaccurate or out of date.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Your account</h2>
        <p className="mt-4 leading-relaxed">
          Signing in uses your Google account through Firebase Authentication. You are responsible
          for keeping that account secure. We describe what we do with your data in our{' '}
          <Link
            to="/privacy"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Acceptable use</h2>
        <p className="mt-4 leading-relaxed">
          Don't use the app to break the law, and don't attempt to disrupt, overload, or reverse the
          service or gain unauthorized access to it or to other users' data.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">No warranty</h2>
        <p className="mt-4 leading-relaxed">
          The app is provided "as is" and "as available", without warranties of any kind. We don't
          guarantee that it will be accurate, complete, uninterrupted, or error-free.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Limitation of liability</h2>
        <p className="mt-4 leading-relaxed">
          To the extent permitted by law, Dungeon Studio is not liable for any indirect, incidental,
          or consequential damages arising from your use of the app.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Governing law</h2>
        <p className="mt-4 leading-relaxed">
          These terms are governed by the laws of England and Wales, and any dispute will be subject
          to the exclusive jurisdiction of the courts of England and Wales. If you are a consumer,
          you may also be entitled to the protection of mandatory provisions of the law of the
          country where you live, and nothing in these terms affects your rights as a consumer to
          rely on those provisions.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Changes to these terms</h2>
        <p className="mt-4 leading-relaxed">
          We may update these terms as the app evolves. When we do, we'll revise the effective date
          above.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Contact</h2>
        <p className="mt-4 leading-relaxed">
          Questions about these terms? Reach us through our{' '}
          <a
            href={`${GITHUB_REPO}/issues/new/choose`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            GitHub repository
          </a>
          .
        </p>
      </article>
    </Container>
  );
}
