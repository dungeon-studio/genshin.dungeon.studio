<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Understanding workflow conventions

The workflow conventions keep CI predictable: a contributor can tell where a check runs, which file it belongs in, and whether it blocks a merge without reading every workflow. For the conventions themselves, see [Workflow conventions](../reference/workflow-conventions.md).

---

## Where a check runs

A check that depends only on the working tree runs as a pre-commit hook, so a commit and a CI run over the same tree give the same answer. The contributor sees the failure before pushing, and the `pre-commit` job in CI is one more run of the same hooks rather than a second definition to keep in sync.

A hook whose tool pre-commit installs is the better hook. A hook calling a tool from `PATH` makes every contributor and the `pre-commit` job install that tool. Docker hooks are worse still: when the daemon is down, they abort the whole pre-commit run, not only their own check.

## Naming

Grouping by trigger makes the trigger the only thing that distinguishes one workflow file from another. A job sharing a file with jobs on a different trigger has to guard itself against their events. Every such guard is a condition a reader must trace. Splitting by trigger removes the guards.

Workflows that mutate state outside the checkout break the pattern on purpose. A reader looking for what deploys the API looks for `deploy.yml`, not for the trigger it happens to use.

Path gates narrow the when further, so a gated check gets its own file. Gating saves runner time, but a gated workflow can't be a required check, so only a check with expensive setup is worth gating.

The rule and its rationale come from [architecture decision record 0004 in alunduil-chezmoi](https://github.com/alunduil/alunduil-chezmoi/blob/main/docs/adr/0004-consolidate-ci-workflow.md).

Once a filename says _when_, it no longer says _what_, so the job name carries that. The ruleset shows a job name without its workflow, so `dev` alone tells a reviewer nothing. A name shared by two jobs is ambiguous, since the ruleset can't tell which run it meant.

## Required checks

A ruleset matches a required check by the job's display name, and nothing ties that name to the job's id or file. A rename stops satisfying the ruleset, so every pull request waits on a check that never reports.

A path-gated workflow doesn't report on a pull request outside its paths. Requiring it would block those pull requests indefinitely, waiting on a check that never starts.

Code scanning and Code Quality both report under the GitHub-managed `Analyze` name, so that name doesn't identify either one.

## Push triggers

A pull request run tests the branch, not the merge result. Another pull request can merge first, and the combination is never tested before it reaches `develop`. A push run attests the branch after the merge lands.

Only branches whose merge result ships or gets inherited need that attestation. Feature branches need no push trigger, because the unfiltered `pull_request` trigger already gates them.

## Pinning tool versions

An installer script piped from a moving branch pins nothing: the script itself can change, and so can the version it chooses. It also hides the dependency from Renovate, which tracks a version only when it can see one. A `*_VERSION` variable naming a release artifact keeps the version explicit and lets Renovate propose the update.
