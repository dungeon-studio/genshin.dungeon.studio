// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

import { ApiError, apiDelete } from '@/lib/api';
import { auth } from '@/lib/firebase';

export interface UseDeleteAccountResult {
  deleteAccount: () => void;
  isDeleting: boolean;
}

/** A request that never reached the server carries no problem document to quote. */
function describeFailure(error: unknown): string {
  return error instanceof ApiError ? error.problem.detail : 'Something went wrong deleting it.';
}

/**
 * Erase the signed-in account, then end the session it belonged to.
 *
 * The server deletes the identity, so the credentials this app holds outlive
 * the account they name. Signing out is what stops the app acting as somebody
 * who no longer exists, and clearing the cache is what stops it showing data
 * the user asked to have erased.
 */
export function useDeleteAccount(): UseDeleteAccountResult {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => apiDelete('/account'),
    onSuccess: async () => {
      await signOut(auth);
      queryClient.clear();
      toast.success('Your account and its data have been deleted.');
    },
    onError: (error: unknown) => {
      toast.error(`Could not delete your account. ${describeFailure(error)}`);
    },
  });

  return {
    deleteAccount: () => {
      mutate();
    },
    isDeleting: isPending,
  };
}
