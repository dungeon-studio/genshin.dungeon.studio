// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from './use-auth';

export function ProtectedRoute(): JSX.Element {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div role="status" aria-busy="true">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
