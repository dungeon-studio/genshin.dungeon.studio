// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

export function MainAffixSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}): JSX.Element {
  return (
    <label className="space-y-1 block">
      <span className="text-xs font-medium text-card-foreground">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : (e.target.value as T))}
        className="px-2 py-1.5 text-xs w-full rounded-md border border-border bg-background text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <option value="">Select main stat...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
