<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

<!-- vale Microsoft.HeadingAcronyms = NO -->

# DSGEP-006: Branching model and its deployment implications

<!-- vale Microsoft.HeadingAcronyms = YES -->

- **Status**: Accepted
- **Created**: 2026-08-23
- **Accepted**: 2026-08-23
- **Authors**: Alex Brandt

## Abstract

This Dungeon Studio Genshin Enhancement Proposal (DSGEP) records the repository's branching model and what it implies for deployment. The model is [git flow](https://nvie.com/posts/a-successful-git-branching-model/) as written: `develop` and `main` are permanent, a `release/*` or `hotfix/*` branch lives from its cut until it merges, and every edge takes a merge commit. Two things sit on top of git flow, which defines neither. Each branch maps to an environment, and every commit reaching `develop` carries a conventional-commit message that the changelog generator reads. Only the `develop` leg runs today.

## Problem statement

The branching model lives in the repository as reference facts with no recorded reasoning. [`infrastructure-branch-flow.md`](../reference/infrastructure-branch-flow.md) lists the branches and the Terraform routing, [`CONTRIBUTING.md`](../../CONTRIBUTING.md) names the topic branches and the squash strategy, and [`workflow-conventions.md`](../reference/workflow-conventions.md) explains which branches get push runs. None of them says why the model looks the way it does, which leaves three problems.

The repository's behaviour and its stated model disagree. `infrastructure-branch-flow.md` calls the model git-flow-style, while the repository squash-merges every pull request and forbids merge commits into `develop`. Git flow does neither, and nothing records which of the two is the intent.

The environment mapping has no home. Git flow defines branch topology and stops there. Mapping `develop` to dev, `release/*` to staging, and `main` to production is this project's own layer, and it's the layer that turns a merge into a deployment.

Downstream work assumes the model. [#327](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/327) automates the release train, [#845](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/845) tags a release per branch, and [#782](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/782) promotes Terraform to production on a push to `main`. Each one needs a settled model to build on.

## Context

The model runs one leg of three.

`develop` is the default branch and the only branch of the model that exists. Neither `main` nor a `release/*` branch exists yet.

Topic branches use `feature/`, `fix/`, `chore/`, and `docs/` prefixes. Squash is the only merge method the repository enables, the pull request title becomes the commit message, and the `develop` ruleset carries `required_linear_history`, which forbids a merge commit into `develop`.

Terraform routing already follows the model, trigger by trigger, in [`infrastructure-branch-flow.md`](../reference/infrastructure-branch-flow.md). Only the `dev` environment has ever taken an apply: `staging` is a bare shell, and no run has yet applied the production configuration.

Application deploys run on `develop` alone, into dev.

Release Drafter keeps a running draft from pull requests merged into `develop`. A draft creates no tag, so publishing and tagging are still manual and unspecified.

The repository carries a single version, in the root `package.json`.

## Decision

### Branches and their environments

| Branch      | Role                                      | Environment | Merges from             |
| ----------- | ----------------------------------------- | ----------- | ----------------------- |
| `develop`   | Integration branch and the default branch | dev         | topic, release, hotfix  |
| `release/*` | Stabilisation branch cut from `develop`   | staging     | fixes found in it       |
| `main`      | Stable release target                     | production  | `release/*`, `hotfix/*` |
| `hotfix/*`  | Urgent production fix, cut from `main`    | none        | the fix commits         |

`develop` and `main` are permanent. A `release/*` or `hotfix/*` branch lives from its cut until it merges.

Topic branches keep the `feature/`, `fix/`, `chore/`, and `docs/` prefixes. Git flow reserves `main`, `develop`, `release/*`, and `hotfix/*` and leaves every other branch name free, so the type prefixes conform to it.

A `hotfix/*` branch deploys no infrastructure. Hotfixes carry application changes only. An infrastructure change travels the normal train.

[`infrastructure-branch-flow.md`](../reference/infrastructure-branch-flow.md) holds the naming rule for a release branch and the Terraform action each trigger takes.

### Merge strategy per edge

Every edge takes a merge commit, created with `--no-ff` so one exists even where the branch could fast-forward. No edge squashes, and no edge cherry-picks.

| Edge                     | Strategy               |
| ------------------------ | ---------------------- |
| topic branch → `develop` | Merge commit           |
| `release/*` → `main`     | Merge commit, then tag |
| `release/*` → `develop`  | Merge commit           |
| `hotfix/*` → `main`      | Merge commit, then tag |
| `hotfix/*` → `develop`   | Merge commit           |

A hotfix cut while a `release/*` branch is live merges into that release branch instead of `develop`, and reaches `develop` when the release finishes.

### Commit messages

Every commit that lands on `develop` carries a conventional-commit message. The changelog generator reads commits, and a merge commit leaves each one intact, so the message rule applies per commit rather than per pull request.

### Release tags

`develop` produces prereleases, `release/*` produces release candidates, and `main` produces the stable release. The stable tag lands on the `main` merge commit, so the tag points at the commit that production runs.

### Version and changelog tooling

[git-cliff](https://git-cliff.org/) generates the changelog and computes the next version from the conventional commits on the branch, skipping the merge commits between them. The repository has one version, tracked in the root `package.json`.

## Rationale

### Why a merge commit on every edge

Git flow's own reason is that `--no-ff` keeps a branch's commits grouped. A feature stays one unit that a single revert removes, and the history records that the branch existed.

Ancestry is the sharper reason on the release edges. Squashing `release/*` into `main` creates a commit with no link to the `develop` commits it came from, so `main` and `develop` diverge permanently and every later release re-presents already-applied changes as conflicts. A merge commit keeps both branches sharing history.

Once merge commits are the rule on the release edges, treating the topic edge differently buys nothing. The `develop` ruleset can't forbid merge commits on one edge and permit them on another, because a branch rule applies to every push. Keeping squash on the topic edge is what forced the cherry-picks.

### Why back-merges instead of cherry-picks

A cherry-pick puts the same content on `develop` under a different hash. The two branches never share the commit, which is the divergence the merge commit on `release/*` into `main` exists to prevent, reappearing for exactly the changes that don't originate on `develop`.

Merging costs a conflict now and then. Git flow says to expect one on this edge and to fix it, which happens once, in the open, rather than accumulating as silent divergence.

### Why every commit carries a conventional message

The changelog generator reads git history. Under squash the pull request title became the single commit, so gating the title was enough. A merge commit preserves the branch's commits instead, so each one is changelog input and each one needs the message.

### Why a release branch at all

The release branch is the staging deployment. Without it, staging has no ref to deploy and a release has no window in which to stabilise, which puts every unreleased commit on `develop` into whatever ships next. The branch also anchors the version: it carries the version in its name, which gives the release candidate tags somewhere to accumulate.

### Why hotfix branches cut from `main`

An urgent production fix needs to reach production without carrying anything else. Cutting a release branch from `develop` to deliver it would drag every unreleased commit along. Cutting from `main` isolates the fix to the code production already runs.

### Why branches map to environments

The mapping makes the branch the promotion mechanism. A merge is the act of promoting, and the branch ruleset is the gate on it. The ref that a workflow sees selects both the Terraform workspace and the deploy target, so nothing separate has to decide what goes where.

### Why git-cliff rather than release-please

A release-please Release PR competes with the release branch for the role of "the thing you merge to release," duplicating what the release train already owns. git-cliff is a pure function over git history and introduces no second release object. Its assumption of a single root version holds here because every workspace package is private and unpublished.

## Consequences

### Positive

- **Ancestry holds on every edge.** No branch carries a change the branch it came from can't see, so a later release presents only what's new.
- **A feature reverts as one unit.** Reverting the merge commit removes the whole branch's work.
- **No duplicate commits.** A change exists once, under one hash, wherever it has reached.
- **One promotion mechanism.** Terraform routing, application deploys, and release tags all key on the same ref, so an environment gains a deploy lane by gaining a branch.
- **A stabilisation window exists.** Staging holds a release candidate while other work continues on `develop`.

### Negative

- **History grows a merge commit per pull request**, on top of that branch's own commits. `git log --first-parent develop` reads as one entry per pull request, and the plain log doesn't.
- **Commit discipline moves earlier.** A branch absorbs its own tidying commits before the merge rather than relying on it, and every commit needs a conventional message rather than one title per pull request.
- **Back-merges conflict.** The `release/*` into `develop` edge collects the conflicts that the cherry-pick alternative would have hidden.
- **`develop` loses `required_linear_history`.** Which merge methods the repository enables becomes the mechanical enforcement, and a rule can no longer forbid the wrong shape on one branch.
- **A hotfix skips staging.** It merges to `main` without ever deploying to an environment, so review and the CI sensors are the only gates in front of production.
- **A feature waits for a train.** Work that lands on `develop` after the release cut ships in the next release, not the current one.
- **Branch protection is deployment protection.** A push to `develop`, `release/*`, or `main` deploys, so a weak ruleset on that branch is a weak gate on the environment behind it.

## Alternatives considered

### Squash into `develop`, cherry-pick back

**Approach**: squash every pull request into `develop` and keep `required_linear_history` there, take a merge commit only on `release/*` into `main`, and return stabilisation fixes and hotfixes to `develop` as cherry-picks.

**Rejected because**: the cherry-pick reintroduces on the return edges the divergence the merge commit into `main` exists to prevent. What it buys, one conventional commit per pull request for the changelog generator, comes just as well from conventional messages on the commits themselves. Squashing `release/*` into `main` as well, which is the repository's behaviour today, fails harder: it collapses a whole release to one commit and severs ancestry outright.

### Rebase and merge into `develop`

**Approach**: replay each pull request's commits onto `develop`, keeping the individual commits and a linear history.

**Rejected because**: a linear `develop` still can't take the back-merge, so the cherry-pick stays. It also rewrites the hashes that review saw and loses the grouping that makes a feature revert as a unit.

### Trunk-based development

**Approach**: one branch, short-lived topic branches, feature flags to hide incomplete work, deploy every commit.

**Rejected because**: with a single ref, the ref can't select an environment, so promotion needs a separate mechanism the repository doesn't have. The project also has no feature-flag infrastructure, and a multi-environment Terraform promotion needs a window in which a candidate sits still.

### GitHub flow

**Approach**: `main` only, deploy on merge, no integration or release branch.

**Rejected because**: it offers no place for a release candidate to soak, no staging ref, and no version anchor. It suits a single-environment service, which this isn't.

### GitLab flow environment branches

**Approach**: permanent `staging` and `production` branches, merged into to promote.

**Rejected because**: it's close to the adopted model but replaces the ephemeral release branch with a permanent one. A permanent staging branch has no cutoff, so nothing marks where one release ends and the next begins. It also carries no version in its name for a release candidate tag to reference, and an ephemeral `release/*` provides both.

### release-please

**Approach**: a bot maintains a Release PR whose merge cuts the release and tags it.

**Rejected because**: the Release PR and the release branch compete for the same role, and the repository already owns the release-train flow.

## Implementation notes

The `develop` leg runs today, and it runs the model this record replaces. These issues land what remains:

- [dungeon-studio-infrastructure#13](https://github.com/dungeon-studio/dungeon-studio-infrastructure/issues/13) enables merge commits, disables squash, and drops `required_linear_history` from the `develop` ruleset.
- [#1229](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1229) creates `main` and its ruleset.
- [#1424](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1424) moves the conventional-commit gate from the pull request title to every commit in the branch.
- [#327](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/327) automates cutting the release branch and the merges that finish it.
- [#845](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/845) publishes and tags the per-branch releases.
- [#1230](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1230) adopts git-cliff and [#1231](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1231) retires Release Drafter.
- [#780](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/780) adds the production Terraform workspace and [#782](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/782) promotes to it on a push to `main`.

## References

- [`infrastructure-branch-flow.md`](../reference/infrastructure-branch-flow.md): the branch-to-environment routing this record explains
- [`workflow-conventions.md`](../reference/workflow-conventions.md): which branches get push runs and why
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md): topic branch naming, commit format, and the merge strategy
- [A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/): the model this record adopts
- [Issue #954](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/954): the request to record this decision
