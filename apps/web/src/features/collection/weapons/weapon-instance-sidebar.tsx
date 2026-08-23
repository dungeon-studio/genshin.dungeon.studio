// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId, RefinementLevel } from '@genshin/domain';
import { REFINEMENT_LEVELS } from '@genshin/domain';
import type { Weapon, WeaponId } from '@genshin/game-data';
import { getWeaponById } from '@genshin/game-data';
import { Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface WeaponInstanceSidebarProps {
  weaponId: WeaponId | null;
  instances: CollectionWeapon[];
  onClose: () => void;
  onAdd: (weaponId: WeaponId) => void;
  onRemove: (collectionWeaponId: CollectionWeaponId) => void;
  onRefinementChange: (collectionWeaponId: CollectionWeaponId, level: RefinementLevel) => void;
}

export function WeaponInstanceSidebar({
  weaponId,
  instances,
  onClose,
  onAdd,
  onRemove,
  onRefinementChange,
}: WeaponInstanceSidebarProps): JSX.Element {
  const weapon: Weapon | undefined = weaponId ? getWeaponById(weaponId) : undefined;

  return (
    <Sheet open={weaponId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:w-1/2 sm:max-w-none flex w-full flex-col overflow-y-auto"
      >
        <SheetHeader>
          <div className="gap-3 pr-6 flex items-start justify-between">
            <div className="gap-3 flex items-start">
              {weapon && (
                <div className="h-10 w-10 text-xs font-bold flex shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
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

        <div className="space-y-3 flex-1">
          {instances.length === 0 && (
            <p className="py-4 text-sm text-center text-muted-foreground">
              No instances yet. Add one to start your collection.
            </p>
          )}

          {[...instances]
            .sort((a, b) => b.refinementLevel - a.refinementLevel)
            .map((instance, index) => (
              <div
                key={instance.weaponInstanceId}
                className="gap-3 p-3 flex items-center rounded-lg border border-border bg-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-card-foreground tabular-nums">
                    R{instance.refinementLevel}
                  </p>
                </div>

                <div className="gap-1 flex items-center">
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
                  className="p-1 shrink-0 rounded-md text-destructive transition-opacity hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none"
                  aria-label={`Remove instance ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" focusable={false} />
                </button>
              </div>
            ))}
        </div>

        {weaponId && (
          <div className="bottom-0 pt-3 sm:hidden sticky border-t border-border bg-background">
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
