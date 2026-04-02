// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './features/auth';
import { CharactersPage } from './pages/CharactersPage';
import { ChatPage } from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TeamsPage } from './pages/TeamsPage';
import { WeaponsPage } from './pages/WeaponsPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/characters" element={<CharactersPage />} />
              <Route path="/weapons" element={<WeaponsPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
