// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/** Name a button that cycles values by the value it shows and the one selecting it moves to. */
export function cycleLabel(subject: string, current: string, next: string): string {
  return `${subject}: ${current}, switch to ${next}`;
}
