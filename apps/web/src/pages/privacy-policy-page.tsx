// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Describes the app's actual data practices. No lawyer has reviewed it.

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
        Alex Brandt operates genshin.dungeon.studio under the name Dungeon Studio and is the
        controller of your personal data. Contact us at <PrivacyEmailLink />.
      </LegalSection>

      <LegalHeading>What we collect</LegalHeading>
      <ul className="mt-4 space-y-2 pl-6 leading-relaxed list-disc">
        <CollectedItem label="Account information">
          When you sign in with Google, we receive your name, email address, profile photo, and
          Google account identifier through Firebase Authentication. Signing in is optional.
        </CollectedItem>
        <CollectedItem label="Your collection">
          The characters and weapons you mark as owned and their levels, and the teams you build.
          Before you sign in this stays in your browser; once you sign in it is saved to our servers
          so it syncs across your devices.
        </CollectedItem>
        <CollectedItem label="Request logs">
          Our servers record each request's address, time, and outcome, and our hosting provider
          records the IP address it came from.
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
      </LegalSection>

      <LegalSection title="Your choices and rights">
        Signing out clears your collection from your browser. Deleting your account erases your
        characters, weapons, and teams along with your sign-in. We cannot undo it. To access,
        correct, or receive a copy of your data, to object to how we use it, or to ask any question
        about your privacy, email <PrivacyEmailLink />. Depending on where you live, you may have
        additional rights over your personal data under laws such as the GDPR or CCPA. You can also
        complain to a data protection authority, such as the UK's{' '}
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
