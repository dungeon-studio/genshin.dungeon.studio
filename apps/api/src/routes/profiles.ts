// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { createVersionedFileRoutes } from '@/routes/versioned-files.js';

export const profiles = createVersionedFileRoutes({
  contentType: 'application/alps+json',
  directory: 'profiles',
});
