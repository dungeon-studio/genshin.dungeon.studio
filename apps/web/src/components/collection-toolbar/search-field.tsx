// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Search } from 'lucide-react';
import type { JSX } from 'react';

import { Input } from '@/components/ui/input';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function SearchField({ value, onChange, label }: SearchFieldProps): JSX.Element {
  return (
    <div className="min-w-28 md:max-w-md relative flex-1">
      <Search
        className="left-2.5 h-4 w-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
        focusable={false}
      />
      <Input
        type="search"
        placeholder="Search…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-9 text-xs [&::-webkit-search-cancel-button]:grayscale"
        aria-label={label}
      />
    </div>
  );
}
