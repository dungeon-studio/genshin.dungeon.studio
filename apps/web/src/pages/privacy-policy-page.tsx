// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Draft content describing the app's actual data practices as of HEAD. Needs a
// legal review pass (and a dedicated privacy-contact address) before the 1.0.0
// tag; see #647.

import type { JSX } from 'react';

import { Container } from '@/components/chrome/container';

const EFFECTIVE_DATE = '3 July 2026';
const GITHUB_REPO = 'https://github.com/dungeon-studio/genshin.dungeon.studio';

export function PrivacyPolicyPage(): JSX.Element {
  return (
    <Container className="max-w-3xl py-12">
      <article className="text-muted-foreground">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground/70">Effective {EFFECTIVE_DATE}</p>

        <p className="mt-6 leading-relaxed">
          genshin.dungeon.studio is an unofficial, fan-made team-building companion for Genshin
          Impact, operated by Dungeon Studio. This policy explains what data we collect, why, and
          how you can control it.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">What we collect</h2>
        <ul className="mt-4 space-y-2 pl-6 leading-relaxed list-disc">
          <li>
            <strong className="font-medium text-foreground">Account information.</strong> When you
            sign in with Google, we receive your name, email address, profile photo, and Google
            account identifier through Firebase Authentication. Signing in is optional.
          </li>
          <li>
            <strong className="font-medium text-foreground">Your collection.</strong> The characters
            and weapons you mark as owned and their levels. Before you sign in this stays in your
            browser; once you sign in it is saved to our servers so it syncs across your devices.
          </li>
          <li>
            <strong className="font-medium text-foreground">Preferences.</strong> Your light or dark
            theme choice, stored only in your browser and never sent to us.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-foreground">What we don't do</h2>
        <p className="mt-4 leading-relaxed">
          We do not use analytics or tracking, serve advertising, or set tracking cookies. We do not
          sell your data or share it for marketing.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">How we use your data</h2>
        <p className="mt-4 leading-relaxed">
          We use your account information to sign you in, and your collection data to save and sync
          it across devices. We don't use it for anything else.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Service providers</h2>
        <p className="mt-4 leading-relaxed">
          We rely on Google Firebase (Firebase Authentication and Cloud Firestore) to authenticate
          you and store your collection on our behalf. Their handling of that data is governed by
          the{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Google Privacy Policy
          </a>
          .
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Your choices and rights</h2>
        <p className="mt-4 leading-relaxed">
          Signing out clears your collection from your browser. To access, correct, or delete the
          data associated with your account, or to ask any question about your privacy, reach us
          through our{' '}
          <a
            href={`${GITHUB_REPO}/issues/new/choose`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            GitHub repository
          </a>
          . Depending on where you live, you may have additional rights over your personal data
          under laws such as the GDPR or CCPA.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Children</h2>
        <p className="mt-4 leading-relaxed">
          This app is not directed to children under 13, and we do not knowingly collect their
          personal information.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Changes to this policy</h2>
        <p className="mt-4 leading-relaxed">
          We may update this policy as the app evolves. When we do, we'll revise the effective date
          above.
        </p>
      </article>
    </Container>
  );
}
