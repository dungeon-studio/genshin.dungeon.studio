// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Describes the service's terms. No lawyer has reviewed them.

import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import { PrivacyEmailLink } from '@/components/legal/legal-link';
import { LegalPage, LegalSection } from '@/components/legal/legal-page';

const EFFECTIVE_DATE = '25 October 2026';

export function TermsOfServicePage(): JSX.Element {
  return (
    <LegalPage title="Terms of Service" effectiveDate={EFFECTIVE_DATE}>
      <p className="mt-6 leading-relaxed">
        By using genshin.dungeon.studio you agree to these terms. If you don't agree, please don't
        use the app.
      </p>

      <LegalSection title="The service">
        genshin.dungeon.studio is a free, unofficial team-building companion for Genshin Impact. It
        helps you track your collection and plan teams. It is provided at no cost and with no
        guarantee of continued availability.
      </LegalSection>

      <LegalSection title="Not affiliated with HoYoverse">
        This is a fan-made project. It is not affiliated with, endorsed by, or sponsored by
        HoYoverse (miHoYo/Cognosphere). Genshin Impact and all related names, characters, and art
        are trademarks and copyright of their respective owners. Game data is presented for
        reference and may be inaccurate or out of date.
      </LegalSection>

      <LegalSection title="Your account">
        Signing in uses your Google account through Firebase Authentication. You are responsible for
        keeping that account secure. We describe what we do with your data in our{' '}
        <Link
          to="/privacy"
          className="text-foreground underline underline-offset-4 hover:no-underline"
        >
          Privacy Policy
        </Link>
        .
      </LegalSection>

      <LegalSection title="Acceptable use">
        Don't use the app to break the law, and don't attempt to disrupt, overload, or reverse the
        service or gain unauthorized access to it or to other users' data.
      </LegalSection>

      <LegalSection title="No warranty">
        The app is provided "as is" and "as available", without warranties of any kind. We don't
        guarantee that it will be accurate, complete, uninterrupted, or error-free.
      </LegalSection>

      <LegalSection title="Limitation of liability">
        To the extent permitted by law, Alex Brandt, who operates the app as Dungeon Studio, is not
        liable for any indirect, incidental, or consequential damages arising from your use of the
        app.
      </LegalSection>

      <LegalSection title="Governing law">
        These terms are governed by the laws of England and Wales, and any dispute will be subject
        to the exclusive jurisdiction of the courts of England and Wales. If you are a consumer, you
        may also be entitled to the protection of mandatory provisions of the law of the country
        where you live, and nothing in these terms affects your rights as a consumer to rely on
        those provisions.
      </LegalSection>

      <LegalSection title="Changes to these terms">
        We may update these terms as the app evolves. When we do, we'll revise the effective date
        above.
      </LegalSection>

      <LegalSection title="Contact">
        Questions about these terms? Email <PrivacyEmailLink />.
      </LegalSection>
    </LegalPage>
  );
}
