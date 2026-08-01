// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ChangeEvent, JSX } from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { ImportPlan, PlannedEntries } from './plan-import';
import { plannedCount } from './plan-import';
import { useCollectionTransfer } from './use-collection-transfer';

export function CollectionTransferCard(): JSX.Element {
  const { exportCollection, readPlan, applyImport, isImporting } = useCollectionTransfer();
  const fileInput = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input so picking the same file twice still fires a change event.
    event.target.value = '';
    if (!file) return;

    const result = await readPlan(file);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    if (plannedCount(result.plan) === 0 && result.plan.skipped.length === 0) {
      toast.info('That export is empty — there is nothing to import.');
      return;
    }

    setPlan(result.plan);
  }

  async function confirmImport() {
    if (!plan) return;

    try {
      await applyImport(plan);
      toast.success('Collection imported.');
      setPlan(null);
    } catch {
      toast.error('Import failed partway through. Some entries may have been applied.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import and export</CardTitle>
        <CardDescription>
          Download your characters, weapons, and teams as a file, or restore them from one.
          Importing matches entries by identity, so the same file can be imported more than once
          without duplicating anything.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={exportCollection}>Export collection</Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={isImporting}>
          Import collection
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => void handleFile(event)}
          data-testid="import-file-input"
        />
      </CardContent>

      <Dialog
        open={plan !== null}
        onOpenChange={(open) => {
          if (!open && !isImporting) setPlan(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import this collection?</DialogTitle>
            <DialogDescription>
              Nothing has changed yet. Here is what importing this file would do.
            </DialogDescription>
          </DialogHeader>

          {plan ? <ImportSummary plan={plan} /> : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPlan(null)} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={() => void confirmImport()} disabled={isImporting}>
              {isImporting ? 'Importing…' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ImportSummary({ plan }: { plan: ImportPlan }): JSX.Element {
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

      {plan.skipped.length > 0 ? (
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
      ) : null}
    </div>
  );
}
