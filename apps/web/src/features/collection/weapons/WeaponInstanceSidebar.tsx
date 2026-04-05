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
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-start gap-3">
              {weapon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                  {weapon.type.slice(0, 3)}
                </div>
              )}
              <div>
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
              </div>
            </div>
            {weaponId && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => onAdd(weaponId)}
                aria-label="Add instance"
              >
                <Plus className="h-5 w-5" aria-hidden="true" focusable={false} />
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-3">
          {instances.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No instances yet. Add one to start your collection.
            </p>
          )}

          {[...instances]
            .sort((a, b) => b.refinementLevel - a.refinementLevel)
            .map((instance, index) => (
              <div
                key={instance.weaponInstanceId}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold tabular-nums text-card-foreground">
                    R{instance.refinementLevel}
                  </p>
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
          <div className="sticky bottom-0 border-t border-border bg-background pt-3 sm:hidden">
            <Button variant="outline" className="w-full" onClick={() => onAdd(weaponId)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" focusable={false} />
              Add instance
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
