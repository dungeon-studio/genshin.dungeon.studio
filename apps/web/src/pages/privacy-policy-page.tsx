// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Describes the app's actual data practices. No lawyer has reviewed it.

import type { JSX } from 'react';

import { Container } from '@/components/chrome/container';
import { ExternalLegalLink, PrivacyEmailLink } from '@/components/legal/legal-link';

const EFFECTIVE_DATE = '25 October 2026';

function CollectedData(): JSX.Element {
  return (
    <ul className="mt-4 space-y-2 pl-6 leading-relaxed list-disc">
      <li>
        <strong className="font-medium text-foreground">Account information.</strong> When you sign
        in with Google, we receive your name, email address, profile photo, and Google account
        identifier through Firebase Authentication. Signing in is optional.
      </li>
      <li>
        <strong className="font-medium text-foreground">Your collection.</strong> The characters and
        weapons you mark as owned and their levels, and the teams you build. Before you sign in this
        stays in your browser; once you sign in it is saved to our servers so it syncs across your
        devices.
      </li>
      <li>
        <strong className="font-medium text-foreground">Request logs.</strong> Our servers record
        each request&apos;s address, time, and outcome, and our hosting provider records the IP
        address it came from.
      </li>
      <li>
        <strong className="font-medium text-foreground">Preferences.</strong> Your light or dark
        theme choice, stored only in your browser and never sent to us.
      </li>
    </ul>
  );
}

export function PrivacyPolicyPage(): JSX.Element {
  return (
    <Container className="max-w-3xl py-12">
      <article className="text-muted-foreground">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground/70">Effective {EFFECTIVE_DATE}</p>

        <p className="mt-6 leading-relaxed">
          genshin.dungeon.studio is an unofficial, fan-made team-building companion for Genshin
          Impact. This policy explains what data we collect, why, and how you can control it.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Who we are</h2>
        <p className="mt-4 leading-relaxed">
          Alex Brandt operates genshin.dungeon.studio under the name Dungeon Studio and is the
          controller of your personal data. Contact us at <PrivacyEmailLink />.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">What we collect</h2>
        <CollectedData />

        <h2 className="mt-8 text-xl font-semibold text-foreground">What we don't do</h2>
        <p className="mt-4 leading-relaxed">
          We do not use analytics or tracking, serve advertising, or set tracking cookies. We do not
          sell your data or share it for marketing.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">How we use your data</h2>
        <p className="mt-4 leading-relaxed">
          We use your account information to sign you in, and your collection data to save and sync
          it across devices. Both are necessary to provide the service you ask for when you sign in.
          We use request logs to keep the service running and secure, which is in our legitimate
          interest. We don't use your data for anything else.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">How long we keep it</h2>
        <p className="mt-4 leading-relaxed">
          We keep your account information and collection until you delete your account. Request
          logs are deleted after 30 days.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Service providers</h2>
        <p className="mt-4 leading-relaxed">
          Google hosts the app and its servers through Firebase Hosting, Cloud Run, Firebase
          Authentication, and Cloud Firestore. Cloudflare routes email sent to our privacy address.
          Your collection is stored in the European Union. Google and Cloudflare may process data in
          other countries under their own data protection terms. Their handling of your data is
          governed by the{' '}
          <ExternalLegalLink href="https://policies.google.com/privacy">
            Google Privacy Policy
          </ExternalLegalLink>{' '}
          and the{' '}
          <ExternalLegalLink href="https://www.cloudflare.com/privacypolicy/">
            Cloudflare Privacy Policy
          </ExternalLegalLink>
          .
        </p>

        <h2 className="mt-8 text-xl font-semibold text-foreground">Your choices and rights</h2>
        <p className="mt-4 leading-relaxed">
          Signing out clears your collection from your browser. Deleting your account erases your
          characters, weapons, and teams along with your sign-in. We cannot undo it. To access,
          correct, or receive a copy of your data, to object to how we use it, or to ask any
          question about your privacy, email <PrivacyEmailLink />. Depending on where you live, you
          may have additional rights over your personal data under laws such as the GDPR or CCPA.
          You can also complain to a data protection authority, such as the UK&apos;s{' '}
          <ExternalLegalLink href="https://ico.org.uk/make-a-complaint/">
            Information Commissioner&apos;s Office
          </ExternalLegalLink>
          .
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
