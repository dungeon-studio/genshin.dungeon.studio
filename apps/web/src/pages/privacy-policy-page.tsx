// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// No lawyer has reviewed this policy.

import type { JSX, ReactNode } from 'react';

import { ExternalLegalLink, PrivacyEmailLink } from '@/components/legal/legal-link';
import { LegalHeading, LegalPage, LegalSection } from '@/components/legal/legal-page';

const EFFECTIVE_DATE = '25 October 2026';

function CollectedItem({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <li>
      <strong className="font-medium text-foreground">{label}.</strong> {children}
    </li>
  );
}

export function PrivacyPolicyPage(): JSX.Element {
  return (
    <LegalPage title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
      <p className="mt-6 leading-relaxed">
        genshin.dungeon.studio is an unofficial, fan-made team-building companion for Genshin
        Impact. This policy explains what data we collect, why, and how you can control it.
      </p>

      <LegalSection title="Who we are">
        Alex Brandt runs genshin.dungeon.studio under the name Dungeon Studio. As the data
        controller, Alex Brandt is responsible for your personal data. Contact us at{' '}
        <PrivacyEmailLink />.
      </LegalSection>

      <LegalHeading>What we collect</LegalHeading>
      <ul className="mt-4 space-y-2 pl-6 leading-relaxed list-disc">
        <CollectedItem label="Account information">
          When you sign in with Google, we receive your name, email address, profile photo, and
          Google account identifier through Firebase Authentication. Signing in is optional.
        </CollectedItem>
        <CollectedItem label="Your collection">
          The characters and weapons you own, their levels, and the teams you build. Before you sign
          in, this stays in your browser. Once you sign in, we save it to our servers so it syncs
          across your devices.
        </CollectedItem>
        <CollectedItem label="Request logs">
          For each request, our servers record what was requested, when, and whether it succeeded.
          Our hosting provider also records the IP address the request came from.
        </CollectedItem>
        <CollectedItem label="Preferences">
          Your light or dark theme choice, stored only in your browser and never sent to us.
        </CollectedItem>
      </ul>

      <LegalSection title="What we don't do">
        We do not use analytics or tracking, serve advertising, or set tracking cookies. We do not
        sell your data or share it for marketing.
      </LegalSection>

      <LegalSection title="How we use your data">
        We use your account information to sign you in, and your collection data to save and sync it
        across devices. Both are necessary to provide the service you ask for when you sign in. We
        use request logs to keep the service running and secure, which is in our legitimate
        interest. We don't use your data for anything else.
      </LegalSection>

      <LegalSection title="How long we keep it">
        We keep your account information and collection until you delete your account. Request logs
        are deleted after 30 days.
      </LegalSection>

      <LegalSection title="Service providers">
        Google runs the app for us. Firebase Hosting serves the site, Cloud Run runs our servers,
        Firebase Authentication handles sign-in, and Cloud Firestore stores your collection in the
        European Union. Cloudflare routes email sent to our privacy address. Google and Cloudflare
        may process data in other countries under their own data protection terms. The{' '}
        <ExternalLegalLink href="https://policies.google.com/privacy">
          Google Privacy Policy
        </ExternalLegalLink>{' '}
        and the{' '}
        <ExternalLegalLink href="https://www.cloudflare.com/privacypolicy/">
          Cloudflare Privacy Policy
        </ExternalLegalLink>{' '}
        govern how they handle your data.
      </LegalSection>

      <LegalSection title="Your choices">
        Signing out clears your collection from your browser. Deleting your account erases your
        sign-in and your characters, weapons, and teams. We can't undo a deletion.
      </LegalSection>

      <LegalSection title="Your rights">
        Email <PrivacyEmailLink /> to access, correct, or get a copy of your data, or to object to
        how we use it. Depending on where you live, laws such as the GDPR or CCPA may give you
        further rights. You can also complain to a data protection authority, such as the UK's{' '}
        <ExternalLegalLink href="https://ico.org.uk/make-a-complaint/">
          Information Commissioner's Office
        </ExternalLegalLink>
        .
      </LegalSection>

      <LegalSection title="Children">
        This app is not directed to children under 13, and we do not knowingly collect their
        personal information.
      </LegalSection>

      <LegalSection title="Changes to this policy">
        We may update this policy as the app evolves. When we do, we'll revise the effective date
        above.
      </LegalSection>
    </LegalPage>
  );
}
