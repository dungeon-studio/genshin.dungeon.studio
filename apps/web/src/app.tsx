// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { JSX } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { Layout } from './components/chrome/layout';
import { ThemeProvider } from './components/chrome/theme-provider';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './features/auth';
import { CharactersPage } from './pages/characters-page';
import { NotFoundPage } from './pages/not-found-page';
import { PrivacyPolicyPage } from './pages/privacy-policy-page';
import { SettingsPage } from './pages/settings-page';
import { TeamsPage } from './pages/teams-page';
import { TermsOfServicePage } from './pages/terms-of-service-page';
import { WeaponsPage } from './pages/weapons-page';

const queryClient = new QueryClient();

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<TeamsPage />} />
                <Route path="/characters" element={<CharactersPage />} />
                <Route path="/weapons" element={<WeaponsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
