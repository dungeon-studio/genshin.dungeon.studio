// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import { Container } from '@/components/chrome/container';
import { useAuth } from '@/features/auth';
import { CollectionTransferCard } from '@/features/collection/transfer/collection-transfer-card';

export function SettingsPage(): JSX.Element {
  const { user } = useAuth();

  return (
    <Container className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

      <div className="space-y-6">
        {user === null ? (
          <p className="text-sm text-muted-foreground">
            You are signed out, so only your characters are stored on this device. You can export
            them, but importing needs an account.
          </p>
        ) : null}

        <CollectionTransferCard />
      </div>
    </Container>
  );
}
