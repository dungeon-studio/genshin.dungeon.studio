// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ISOTimestamp, UserProfile } from '@genshin/types';

export interface DocumentData {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function fromDocument(data: DocumentData): UserProfile {
  return {
    name: data.name,
    createdAt: data.createdAt as ISOTimestamp,
    updatedAt: data.updatedAt as ISOTimestamp,
  };
}

export function toDocument(profile: UserProfile): DocumentData {
  return {
    name: profile.name,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
