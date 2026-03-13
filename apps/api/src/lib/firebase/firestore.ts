// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { app } from '@/lib/firebase/app.js';
import { getFirestore } from 'firebase-admin/firestore';

export const db = getFirestore(app);
