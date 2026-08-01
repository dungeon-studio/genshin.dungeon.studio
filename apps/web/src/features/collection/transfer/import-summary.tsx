// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import type { ImportPlan, PlannedEntries } from './plan-import';

/** What an import would do, shown before anything is written. */
export function ImportSummary({ plan }: { plan: ImportPlan }): JSX.Element {
  const rows: Array<{ label: string; entries: PlannedEntries<unknown> }> = [
    { label: 'Characters', entries: plan.characters },
    { label: 'Weapons', entries: plan.weapons },
    { label: 'Teams', entries: plan.teams },
  ];

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th scope="col" className="pb-1 font-medium">
              Type
            </th>
            <th scope="col" className="pb-1 text-right font-medium">
              New
            </th>
            <th scope="col" className="pb-1 text-right font-medium">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, entries }) => (
            <tr key={label}>
              <th scope="row" className="py-1 text-left font-normal">
                {label}
              </th>
              <td className="py-1 text-right tabular-nums">{entries.create.length}</td>
              <td className="py-1 text-right tabular-nums">{entries.update.length}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {plan.skipped.length > 0 ? <SkippedEntries plan={plan} /> : null}
    </div>
  );
}

function SkippedEntries({ plan }: { plan: ImportPlan }): JSX.Element {
  return (
    <div className="text-sm text-muted-foreground">
      <p className="font-medium text-foreground">
        {plan.skipped.length} {plan.skipped.length === 1 ? 'entry' : 'entries'} will be skipped
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {plan.skipped.map((entry, index) => (
          <li key={`${entry.kind}-${entry.label}-${String(index)}`}>
            {entry.label} — {entry.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
