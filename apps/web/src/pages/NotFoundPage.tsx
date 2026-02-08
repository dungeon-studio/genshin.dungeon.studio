// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-2xl font-semibold text-gray-900">Page Not Found</p>
        <p className="mt-2 text-gray-600">Sorry, we couldn't find the page you're looking for.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
