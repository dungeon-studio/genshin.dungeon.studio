// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ComponentProps, JSX } from 'react';
import { Toaster as Sonner } from 'sonner';

import { useTheme } from '@/components/chrome/use-theme';

type ToasterProps = ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps): JSX.Element {
  const { isDark } = useTheme();

  return (
    <Sonner
      className="toaster group"
      // Sonner keys its palettes off this prop, not the `dark` class, and defaults to light.
      theme={isDark ? 'dark' : 'light'}
      // The only edge clear of both the sticky filter bar and the right-hand instance sheet.
      position="bottom-center"
      richColors
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:shadow-lg',
        },
      }}
      {...props}
    />
  );
}
