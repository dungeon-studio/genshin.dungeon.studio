<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Interaction principles

Every view and interaction in `apps/web` meets these rules, so a user can
predict an action's effect and see what it did. Each rule names something a
reviewer can check against one view, and cites the cognitive engineering source
it applies. Visual design, accessibility conformance, and copy tone are out of
scope.

A view is anything a user reads or acts on: a page, sheet, dialog, popover,
toast, and each of its loading, empty, and error states. An interaction is one
control and everything it causes, including the optimistic update and rollback
behind a write.

The rules follow the order a user meets a view. The first group bridges the
gulf of execution, working out what to do. The second bridges the gulf of
evaluation, working out what state the app is in. Both gulfs come from chapter 2
of [Norman2013].

Link a rule by its anchor, which stays fixed when the wording changes.

## Knowing what to do

<a id="visible-controls"></a>

### Every control is visible without hover or focus

Each action has a signifier a user can see without hovering over or focusing
it, so touch and keyboard users find it. Hover and focus may add emphasis. An
action revealed on hover passes only when the same action is visible elsewhere.

Fails when: a team's rename pencil appears only while the pointer is over the
team.

Source: signifiers and discoverability, chapters 1 and 4 of [Norman2013].

<a id="action-labels"></a>

### A control's label says what it does

A command button names the action it takes, not the state it's in, as with an
"Add to collection" button that never reads "In collection" once pressed. A
toggle keeps one label and shows its state through `aria-pressed` rather than
relabeling itself. A control that causes a side effect, such as adding to the
collection, names that effect too.

Fails when: a button that cycles the sort order names only the current order.

Source: signifiers and the conceptual model, chapter 1 of [Norman2013], the
button pattern of the ARIA Authoring Practices Guide [APG], and match between
the system and the real world, heuristic 2 of [Nielsen1994].

<a id="available-controls"></a>

### A control accepts input only when its action can succeed

The view turns off a control whose action would fail or would act on data that
hasn't loaded. It says why in text a keyboard or touch user can reach, not only
in a tooltip. A control whose action can become available stays visible rather
than removed. When an action needs sign-in, the control offers sign-in rather
than doing nothing.

A form's submit button stays on, and pressing it names what's missing.

Fails when: a control is off until the collection loads, and only a hover
tooltip says why.

Source: constraints, chapters 4 and 5 of [Norman2013], and error prevention,
heuristic 5 of [Nielsen1994].

<a id="recognition"></a>

### A user recognizes options rather than recalls them

A view shows what the user needs to decide, such as which member a choice
applies to and the filter that narrowed a list.

Fails when: the weapon pool doesn't show which team member it's choosing for.

Source: recognition rather than recall, heuristic 6 of [Nielsen1994], and
cognitive load [Sweller1988].

## Knowing what happened

<a id="write-state"></a>

### Every write shows whether it's pending, saved, failed, or not kept

A user who changes something can tell, from the view they're on, whether the
server has the change yet. An optimistic update shows the new value at once
and, after about a second, marks it pending on or near the thing that changed.
Saved state shows in the same place. Failure can arrive as a toast.

A view that keeps edits only in memory, such as a signed-out draft, says so
before the user starts, and names what discards them.

Fails when: a constellation change shows no sign that it's still saving.

Source: visibility of system status, heuristic 1 of [Nielsen1994], error
prevention, heuristic 5, and [Nielsen1993].

<a id="loading-state"></a>

### Data that hasn't loaded never renders as empty

A view still waiting on data after about a second shows that it's loading. A
failed load says so in place of the content and offers a retry. Neither renders
the defaults or empty state a user would read as "you have nothing here."

Fails when: the teams page shows default teams while the user's teams load.

Source: feedback, chapter 1 of [Norman2013], visibility of system status,
heuristic 1 of [Nielsen1994], and [Nielsen1993].

<a id="visible-effect"></a>

### Every action has a visible effect or says why it had none

Clicking, typing, or selecting changes the view, or a message explains why it
didn't. An effect that takes longer than about a second shows that the app is
working. A failure the user caused by dismissing something, such as closing a
sign-in popup, needs no message.

Fails when: the browser blocks the sign-in popup and the view doesn't change.

Source: feedback, chapter 1 of [Norman2013], and [Nielsen1993].

<a id="stable-edits"></a>

### An edit leaves the edited thing where it was

Editing a row doesn't move it out from under the pointer. A list sorted by the
edited field keeps the row in place until the user re-sorts or leaves the view.

Editing one value doesn't clear another.

Fails when: changing a weapon's refinement re-sorts its row while the sheet is
open.

Source: the conceptual model a user builds from what they see, chapter 1 of
[Norman2013], and consistency and standards, heuristic 4 of [Nielsen1994].

<a id="external-changes"></a>

### A change the user didn't make arrives with notice

A change from outside the user's own action, such as a refetch replacing local
state, arrives with a message, or waits until the user isn't mid-edit.

An edit never reverts and then reappears.

Fails when: a refetch during a save shows the old team for a moment before the
edit returns.

Source: the conceptual model a user builds from what they see, chapter 1 of
[Norman2013], and visibility of system status, heuristic 1 of [Nielsen1994].

<a id="failure-messages"></a>

### A failure names what failed, what reverted, and what to do next

When a write fails, the message names the thing in the user's terms: which
team, character, or weapon, and what came back. It also names a next step:
retry, reload, sign in again, or report the problem.

The value the user entered stays recoverable, such as through a retry that
sends it again, or the message names what the user lost.

Fails when: a toast names neither the item nor a next step.

Source: feedback and error, chapters 1 and 5 of [Norman2013], help users
recognize, diagnose, and recover from errors, heuristic 9 of [Nielsen1994], and
[Neusesser2023].

<a id="destructive-actions"></a>

### Destructive actions offer undo

Removing something the user can't get back without redoing work offers undo.
An action that undo can't reverse asks first, and the question names the thing
it destroys. The more work it destroys, the stronger the confirmation, up to
typing the item's name.

Fails when: removing a weapon instance deletes it with no way back.

Source: undo and confirmation, chapter 5 of [Norman2013], user control and
freedom, heuristic 3 of [Nielsen1994], error prevention, heuristic 5, and
[Nielsen2018].

## References

<!-- vale Vale.Spelling = NO -->
<!-- vale Google.Colons = NO -->

- [APG] W3C Web Accessibility Initiative. "Button Pattern." _ARIA Authoring
  Practices Guide_. <https://www.w3.org/WAI/ARIA/apg/patterns/button/>
- [Neusesser2023] Tim Neusesser and Evan Sunwall. "Error-Message Guidelines."
  Nielsen Norman Group, 2023.
  <https://www.nngroup.com/articles/error-message-guidelines/>
- [Nielsen1993] Jakob Nielsen. "Response Times: The 3 Important Limits."
  Nielsen Norman Group, 1993.
  <https://www.nngroup.com/articles/response-times-3-important-limits/>
- [Nielsen1994] Jakob Nielsen. _10 Usability Heuristics for User Interface
  Design_. Nielsen Norman Group, 1994, last reviewed 2024.
  <https://www.nngroup.com/articles/ten-usability-heuristics/>
- [Nielsen2018] Jakob Nielsen. "Confirmation Dialogs Can Prevent User Errors:
  If Not Overused." Nielsen Norman Group, 2018.
  <https://www.nngroup.com/articles/confirmation-dialog/>
- [Norman2013] Donald A. Norman. _The Design of Everyday Things_, revised and
  expanded edition. Basic Books, 2013. ISBN 978-0-465-05065-9.
- [Sweller1988] John Sweller. "Cognitive Load During Problem Solving: Effects
  on Learning." _Cognitive Science_ 12, no. 2, 1988, pages 257–285.
  <https://doi.org/10.1207/s15516709cog1202_4>

<!-- vale Google.Colons = YES -->
<!-- vale Vale.Spelling = YES -->
