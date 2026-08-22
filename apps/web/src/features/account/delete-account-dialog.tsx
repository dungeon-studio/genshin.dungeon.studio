// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { useDeleteAccount } from './use-delete-account';

const CONFIRMATION = 'delete';

export interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Confirm an erasure that cannot be undone. */
export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps): JSX.Element {
  const [confirmation, setConfirmation] = useState('');
  const { deleteAccount, isDeleting } = useDeleteAccount();
  const inputId = useId();

  const confirmed = confirmation.trim().toLowerCase() === CONFIRMATION;

  function handleOpenChange(next: boolean) {
    setConfirmation('');
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This erases your characters, weapons, and teams along with your sign-in, and cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor={inputId} className="text-sm font-medium block text-foreground">
            Type {CONFIRMATION} to confirm
          </label>
          <Input
            id={inputId}
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
            }}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={!confirmed || isDeleting}
            onClick={() => {
              deleteAccount();
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
