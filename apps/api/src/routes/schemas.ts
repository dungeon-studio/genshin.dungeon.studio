// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { createVersionedFileRoutes } from '@/routes/versioned-files.js';

export const schemas = createVersionedFileRoutes({
  contentType: 'application/schema+json',
  directory: 'schemas',
});
