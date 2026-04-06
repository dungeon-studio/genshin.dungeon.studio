// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { TeamMember, TeamSlot } from '@genshin/domain';
import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { Pencil } from 'lucide-react';
import { useRef, useState } from 'react';

import { TeamCharacterPlanner } from '@/components/TeamCharacterPlanner';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/features/collection/characters/useCharacterCollection';

interface TeamPlannerProps {
  slot: TeamSlot;
  name: string;
  members: TeamMember[];
  onNameChange: (name: string) => void;
  onEdit?: () => void;
}

export function TeamPlanner({ slot, name, members, onNameChange, onEdit }: TeamPlannerProps) {
  const slots = Array.from({ length: MAX_TEAM_MEMBERS }, (_, i) => members[i]);
  const { getCharacter } = useCollection();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setEditValue(name);
    setEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed) {
      onNameChange(trimmed);
    }
    setEditing(false);
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          {editing ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="h-8 w-48 text-xl font-semibold"
              aria-label={`Rename team ${slot}`}
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="group flex items-center gap-1.5 hover:text-primary"
              aria-label={`Edit name of ${name}`}
            >
              {name}
              <Pencil
                className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
                focusable={false}
              />
            </button>
          )}
        </h2>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="ml-auto rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label={`Edit ${name}`}
          >
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {slots.map((member, i) => (
          <TeamCharacterPlanner
            key={i}
            member={member}
            collectionCharacter={member ? getCharacter(member.characterId) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
