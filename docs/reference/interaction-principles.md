<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Interaction principles

Rules every view and interaction in `apps/web` meets, so a user can predict an
action's effect and see what it did. Each rule names something a reviewer can
check against one view, and cites the cognitive engineering source it applies.
Visual design, accessibility conformance, and copy tone are out of scope.

A view is anything a user reads or acts on: a page, sheet, dialog, popover,
toast, and each of its loading, empty, and error states. An interaction is one
control and everything it causes, including the optimistic update and rollback
behind a write.

## Rules

### 1. Every write shows whether it's pending, saved, or failed

A user who changes something can tell, from the view they're on, whether the
server has the change yet. Failure can arrive as a toast. Pending and saved
states sit on or near the thing that changed.

Source: the gulf of evaluation [Norman2013] and visibility of system status,
heuristic 1 of [Nielsen1994].

### 2. Data that hasn't loaded never renders as empty

A view waiting on data shows that it's loading. A failed load says so in
place of the content and offers a retry. Neither renders the defaults or empty
state a user would read as "you have nothing here."

Source: feedback, chapter 1 of [Norman2013], and visibility of system status,
heuristic 1 of [Nielsen1994].

### 3. A control accepts input only when its action can succeed

The view turns off or removes a control whose action would fail or would act
on data that hasn't loaded, and says why. When an action needs sign-in, the
control offers sign-in rather than doing nothing.

Source: the gulf of execution and constraints, chapters 2 and 4 of
[Norman2013], and error prevention, heuristic 5 of [Nielsen1994].

### 4. Every action has a visible effect or says why it had none

Clicking, typing, or selecting changes the view, or a message explains why it
didn't. A failure the user caused by dismissing something, such as closing a
sign-in popup, needs no message.

Source: feedback, chapter 1 of [Norman2013].

### 5. A rollback names what it undid

When a failed write reverts the view, the message names the thing that
changed in the user's terms: which team, character, or weapon, and what came
back.

Source: help users recognize, diagnose, and recover from errors, heuristic 9
of [Nielsen1994], and match between system and the real world, heuristic 2.

### 6. A failure says what the user can do next

An error message names a next step: retry, reload, sign in again, or report
the problem. A message that only says something failed leaves the user to
guess.

Source: help users recognize, diagnose, and recover from errors, heuristic 9
of [Nielsen1994].

### 7. The view changes only in response to the user or with notice

Values don't clear, rows don't reorder under the pointer, and an edit doesn't
snap back and return. A change from outside the user's own action, such as a
refetch replacing local state, arrives with a message, or waits until the user
isn't mid-edit.

Source: the conceptual model a user builds from what they see, chapter 1 of
[Norman2013], and user control and freedom, heuristic 3 of [Nielsen1994].

### 8. Destructive actions ask first or offer undo

Removing something the user can't get back without redoing work asks first or
offers undo. The more work it destroys, the stronger the confirmation.

Source: user control and freedom, heuristic 3 of [Nielsen1994], and error
prevention, heuristic 5.

### 9. Every control is visible without hover

Each action has a signifier a user on touch or keyboard can see. Hover may
add emphasis, never the only cue that a control exists.

Source: signifiers and discoverability, chapters 1 and 4 of [Norman2013].

### 10. A control does what its label says, and only that

A control's label, icon, and accessible name describe the action it takes,
not the state it's in. The control that causes a side effect, such as adding
to the collection, names it.

Source: mapping, chapter 1 of [Norman2013], and match between system and the
real world, heuristic 2 of [Nielsen1994].

### 11. Work held only in memory says so before the user invests in it

A view that holds edits only in memory, such as a signed-out draft, says so
before the user starts, and names what discards it.

Source: visibility of system status, heuristic 1 of [Nielsen1994], and error
prevention, heuristic 5.

### 12. A user recognizes options rather than recalls them

A view shows what the user needs to decide: why the view locks an option,
which member a choice applies to, and the filter that narrowed a list. The
user doesn't carry state from another view in memory.

Source: recognition rather than recall, heuristic 6 of [Nielsen1994], and
extraneous cognitive load [Sweller1988].

## References

<!-- vale Vale.Spelling = NO -->
<!-- vale Google.Colons = NO -->

- [Norman2013] Donald A. Norman. _The Design of Everyday Things_, revised and
  expanded edition. Basic Books, 2013. ISBN 978-0-465-05065-9.
- [Nielsen1994] Jakob Nielsen. _10 Usability Heuristics for User Interface
  Design_. Nielsen Norman Group, 1994, updated 2024.
  <https://www.nngroup.com/articles/ten-usability-heuristics/>
- [Sweller1988] John Sweller. "Cognitive Load During Problem Solving: Effects
  on Learning." _Cognitive Science_ 12, no. 2, 1988, pages 257–285.
  <https://doi.org/10.1207/s15516709cog1202_4>

<!-- vale Google.Colons = YES -->
<!-- vale Vale.Spelling = YES -->
