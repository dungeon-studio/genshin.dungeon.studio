// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_REFINEMENT_LEVEL, MIN_REFINEMENT_LEVEL } from '@genshin/domain';
import type { Weapon } from '@genshin/game-data';
import { getWeaponById } from '@genshin/game-data';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import type { WeaponInstance, WeaponInstanceId } from './useWeaponCollectionStore';

const REFINEMENT_LEVELS = Array.from(
  { length: MAX_REFINEMENT_LEVEL - MIN_REFINEMENT_LEVEL + 1 },
  (_, i) => MIN_REFINEMENT_LEVEL + i,
);

interface WeaponInstanceSidebarProps {
  weaponId: string | null;
  instances: WeaponInstance[];
  onClose: () => void;
  onAdd: (weaponId: string) => void;
  onRemove: (weaponInstanceId: WeaponInstanceId) => void;
  onRefinementChange: (weaponInstanceId: WeaponInstanceId, level: number) => void;
}

export function WeaponInstanceSidebar({
  weaponId,
  instances,
  onClose,
  onAdd,
  onRemove,
  onRefinementChange,
}: WeaponInstanceSidebarProps) {
  const weapon: Weapon | undefined = weaponId ? getWeaponById(weaponId) : undefined;

  return (
    <Sheet open={weaponId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto sm:w-1/2 sm:max-w-none"
      >
        <SheetHeader>
          <SheetTitle asChild>
            <h2>{weapon?.name ?? 'Weapon'}</h2>
          </SheetTitle>
          <SheetDescription asChild>
            <p>
              {weapon && (
                <>
                  <span className="text-geo-dark" aria-hidden="true">
                    {weapon.rarity}★
                  </span>
                  <span className="sr-only">{weapon.rarity}-star</span>
                  {` · ${weapon.type}`}
                </>
              )}
            </p>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3">
          {instances.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No instances yet. Add one to start your collection.
            </p>
          )}

          {instances.map((instance, index) => (
            <div
              key={instance.weaponInstanceId}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-card-foreground">Instance {index + 1}</p>
              </div>

              <div className="flex items-center gap-1">
                {REFINEMENT_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onRefinementChange(instance.weaponInstanceId, level)}
                    className={cn(
                      'h-7 w-7 rounded text-xs font-bold tabular-nums transition-colors',
                      level === instance.refinementLevel
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                    aria-label={`Set refinement level ${level}`}
                    aria-pressed={level === instance.refinementLevel}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onRemove(instance.weaponInstanceId)}
                className="shrink-0 rounded-md p-1 text-destructive transition-opacity hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                aria-label={`Remove instance ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" focusable={false} />
              </button>
            </div>
          ))}
        </div>

        {weaponId && (
          <Button variant="outline" className="mt-3 w-full" onClick={() => onAdd(weaponId)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" focusable={false} />
            Add another
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
