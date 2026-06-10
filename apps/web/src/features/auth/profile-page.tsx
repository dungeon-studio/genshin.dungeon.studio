// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ProfileResponse } from '@genshin/domain';
import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { LogoutButton } from './logout-button';
import { useProfileQuery, useUpdateProfileMutation } from './use-profile';

export function ProfilePage() {
  const { data: profile, isLoading, error } = useProfileQuery();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="sr-only">Profile</h1>
        <div className="flex items-center justify-center py-24">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden="true"
            focusable={false}
          />
          <span className="sr-only">Loading profile</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load your profile. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <LogoutButton />
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          {profile.picture ? (
            <img
              src={profile.picture}
              alt=""
              aria-hidden="true"
              className="h-16 w-16 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div>
            <CardTitle className="text-xl">{profile.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {profile.email ?? 'No email on file'}
              {profile.email ? (
                <span className="ml-2">
                  {profile.emailVerified ? '· Verified' : '· Unverified'}
                </span>
              ) : null}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {/* Re-mount on the persisted name so the editable field re-seeds after
              a successful save without syncing state from props in an effect. */}
          <DisplayNameForm key={profile.name} profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}

function DisplayNameForm({ profile }: { profile: ProfileResponse }) {
  const updateProfile = useUpdateProfileMutation();
  const [name, setName] = useState(profile.name);

  const trimmed = name.trim();
  const unchanged = trimmed.length === 0 || trimmed === profile.name;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unchanged) return;
    updateProfile.mutate({ name: trimmed });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium">
            Display name
          </label>
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={updateProfile.isPending}
            autoComplete="name"
          />
        </div>
        <Button type="submit" disabled={unchanged || updateProfile.isPending}>
          {updateProfile.isPending ? 'Saving…' : 'Save'}
        </Button>
      </form>
      {updateProfile.isError ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          Could not save your changes. Please try again.
        </p>
      ) : null}
    </>
  );
}
