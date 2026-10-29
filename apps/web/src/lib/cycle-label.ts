// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Name a button that steps through values, per the action-labels interaction principle.
 * When the button shows text, pass that text as `current` so speech-input users can say what they see.
 */
export function cycleLabel(subject: string, current: string, next: string): string {
  return `${subject}: ${current}, switch to ${next}`;
}
