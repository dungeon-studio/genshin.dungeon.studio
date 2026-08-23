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

This Dungeon Studio Genshin Enhancement Proposal (DSGEP) records the repository's branching model and what it implies for deployment. The model keeps git flow's split: `develop` and `main` are permanent, while a `release/*` or `hotfix/*` branch lives only from its cut until it merges. Each branch maps to an environment, and each merge edge carries its own strategy. The model resembles [git flow](https://nvie.com/posts/a-successful-git-branching-model/) and diverges from it in three deliberate places. Pull requests into `develop` squash instead of taking a merge commit, changes travel from `main` back to `develop` as cherry-picks instead of back-merges, and topic branches carry conventional-commit type names. Only the `develop` leg runs today.

## Problem statement

The branching model lives in the repository as reference facts with no recorded reasoning. [`infrastructure-branch-flow.md`](../reference/infrastructure-branch-flow.md) lists the branches and the Terraform routing, [`CONTRIBUTING.md`](../../CONTRIBUTING.md) names the topic branches and the squash strategy, and [`workflow-conventions.md`](../reference/workflow-conventions.md) explains which branches get push runs. None of them says why the model looks the way it does, which leaves three problems.

Divergences from git flow read as accidents. A contributor who knows git flow finds squash merges where `--no-ff` belongs and no `hotfix/*` in the topic branch list, with nothing to say whether either was a choice.

The environment mapping has no home. Git flow defines branch topology and stops there. Mapping `develop` to dev, `release/*` to staging, and `main` to production is this project's own layer, and it's the layer that turns a merge into a deployment.

Downstream work assumes the model. [#327](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/327) automates the release train, [#845](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/845) tags a release per branch, and [#782](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/782) promotes Terraform to production on a push to `main`. Each one needs a settled model to build on.

## Context

The model runs one leg of three.

`develop` is the default branch and the only branch of the model that exists. Neither `main` nor a `release/*` branch has been cut yet.

Topic branches use `feature/`, `fix/`, `chore/`, and `docs/` prefixes, and every pull request squashes into `develop`. The pull request title becomes the commit message and carries the conventional-commit format, so `develop` holds exactly one conventional commit per pull request.

The `develop` ruleset carries `required_linear_history`, and its condition targets the default branch alone, so no other branch inherits it.

Terraform routing already follows the model, trigger by trigger, in [`infrastructure-branch-flow.md`](../reference/infrastructure-branch-flow.md). Only the `dev` environment has ever taken an apply: `staging` is a bare shell, and no run has yet applied the production configuration.

Application deploys run on `develop` alone, into dev.

Release Drafter keeps a running draft from pull requests merged into `develop`. A draft creates no tag, so publishing and tagging are still manual and unspecified.

The repository carries a single version, in the root `package.json`.

## Decision

### Branches and their environments

| Branch      | Role                                      | Environment | Merges from             |
| ----------- | ----------------------------------------- | ----------- | ----------------------- |
| `develop`   | Integration branch and the default branch | dev         | topic branches          |
| `release/*` | Stabilisation branch cut from `develop`   | staging     | fixes found in it       |
| `main`      | Stable release target                     | production  | `release/*`, `hotfix/*` |
| `hotfix/*`  | Urgent production fix, cut from `main`    | none        | the fix commits         |

`develop` and `main` are permanent. A `release/*` or `hotfix/*` branch lives from its cut until it merges.

A `hotfix/*` branch deploys no infrastructure. Hotfixes carry application changes only. An infrastructure change travels the normal train.

[`infrastructure-branch-flow.md`](../reference/infrastructure-branch-flow.md) holds the naming rule for a release branch and the Terraform action each trigger takes.

### Merge strategy per edge

| Edge                     | Strategy     |
| ------------------------ | ------------ |
| topic branch → `develop` | Squash       |
| `release/*` → `main`     | Merge commit |
| `hotfix/*` → `main`      | Merge commit |
| `main` → `develop`       | Cherry-pick  |

The strategy is per-branch rather than per-repository. `required_linear_history` stays on the `develop` ruleset and stays off the `main` and `release/**` ruleset.

Changes that land on `main` without passing through `develop`, meaning fixes made during stabilisation and hotfixes, return to `develop` as cherry-picks. There's no back-merge pull request.

### Release tags

`develop` produces prereleases, `release/*` produces release candidates, and `main` produces the stable release. The stable tag lands on the `main` merge commit, so the tag points at the commit that production runs.

### Version and changelog tooling

[git-cliff](https://git-cliff.org/) generates the changelog and computes the next version from the conventional commits on the branch. The repository has one version, tracked in the root `package.json`.

## Rationale

### Why a release branch at all

The release branch is the staging deployment. Without it, staging has no ref to deploy and a release has no window in which to stabilise, which puts every unreleased commit on `develop` into whatever ships next. The branch also anchors the version: it carries the version in its name, which gives the release candidate tags somewhere to accumulate.

### Why squash into `develop` but merge commits into `main`

Squashing into `develop` produces one conventional commit per pull request. That property is what git-cliff reads, and it's what keeps the history legible: a reader scanning `develop` sees changes, not the review iterations that produced them.

Squashing `release/*` into `main` breaks ancestry. The squash creates a commit on `main` with no link to the `develop` commits it came from, so `main` and `develop` diverge permanently and every later release re-presents already-applied changes as conflicts. It also collapses an entire release into a single commit on `main`. A merge commit keeps both branches sharing history and preserves the per-pull-request commits inside the release.

### Why cherry-picks instead of back-merges

A back-merge is a merge commit into `develop`, which `required_linear_history` forbids. Dropping that rule for back-merges would cost the one-conventional-commit-per-pull-request property that the changelog generator depends on. Fixes made during stabilisation should be rare, so paying a cherry-pick for each one costs less than giving up the property for every pull request.

### Why hotfix branches cut from `main`

An urgent production fix needs to reach production without carrying anything else. Cutting a release branch from `develop` to deliver it would drag every unreleased commit along. Cutting from `main` isolates the fix to the code production already runs.

### Why branches map to environments

The mapping makes the branch the promotion mechanism. A merge is the act of promoting, and the branch ruleset is the gate on it. The ref that a workflow sees selects both the Terraform workspace and the deploy target, so nothing separate has to decide what goes where.

### Why git-cliff rather than release-please

A release-please Release PR competes with the release branch for the role of "the thing you merge to release," duplicating what the release train already owns. git-cliff is a pure function over git history and introduces no second release object. Its assumption of a single root version holds here because every workspace package is private and unpublished.

## Consequences

### Positive

- **One promotion mechanism.** Terraform routing, application deploys, and release tags all key on the same ref, so an environment gains a deploy lane by gaining a branch.
- **Ancestry survives releases.** `main` and `develop` share history, so a later release presents only what's new.
- **`develop` stays readable.** One conventional commit per pull request feeds the changelog generator and keeps the log scannable.
- **Urgent fixes stay isolated.** A hotfix ships the fix and nothing else.
- **A stabilisation window exists.** Staging holds a release candidate while other work continues on `develop`.

### Negative

- **Two merge strategies mean two rulesets.** `required_linear_history` can't apply repository-wide, so the `main` and `release/**` ruleset must stay separate and must not inherit it.
- **Cherry-picks duplicate commits.** The same change reaches `develop` under a different hash, so changelog generation and release diffs need to tolerate seeing it twice.
- **A hotfix skips staging.** It merges to `main` without ever deploying to an environment, so review and the CI sensors are the only gates in front of production.
- **A feature waits for a train.** Work that lands on `develop` after the release cut ships in the next release, not the current one.
- **Branch protection is deployment protection.** A push to `develop`, `release/*`, or `main` deploys, so a weak ruleset on that branch is a weak gate on the environment behind it.

## Alternatives considered

### Strict git flow

**Approach**: `--no-ff` merges on every edge, topic branches limited to `feature/` and `hotfix/`, back-merges into `develop` as merge commits.

**Rejected because**: merge commits on every topic branch bury the one-commit-per-pull-request property under review iterations, and the changelog generator reads that property.

### Trunk-based development

**Approach**: one branch, short-lived topic branches, feature flags to hide incomplete work, deploy every commit.

**Rejected because**: with a single ref, the ref can't select an environment, so promotion needs a separate mechanism the repository doesn't have. The project also has no feature-flag infrastructure, and a multi-environment Terraform promotion needs a window in which a candidate sits still.

### GitHub flow

**Approach**: `main` only, deploy on merge, no integration or release branch.

**Rejected because**: it offers no place for a release candidate to soak, no staging ref, and no version anchor. It suits a single-environment service, which this isn't.

### GitLab flow environment branches

**Approach**: permanent `staging` and `production` branches, merged into to promote.

**Rejected because**: it's close to the adopted model but replaces the ephemeral release branch with a permanent one. A permanent staging branch has no cutoff, so nothing marks where one release ends and the next begins. It also carries no version in its name for a release candidate tag to reference, and an ephemeral `release/*` provides both.

### Squash everywhere

**Approach**: squash every edge, including `release/*` into `main`.

**Rejected because**: it severs ancestry between `main` and `develop`, as described in the rationale, and collapses a release to one commit.

### release-please

**Approach**: a bot maintains a Release PR whose merge cuts the release and tags it.

**Rejected because**: the Release PR and the release branch compete for the same role, and the repository already owns the release-train flow.

## Implementation notes

The `develop` leg runs today. This record settles the other legs, and these issues land them:

- [#1229](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1229) creates `main` and its ruleset.
- [dungeon-studio-infrastructure#13](https://github.com/dungeon-studio/dungeon-studio-infrastructure/issues/13) permits merge commits, which the `release/*` and `hotfix/*` edges into `main` need.
- [#327](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/327) automates cutting the release branch and opening the release pull request.
- [#845](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/845) publishes and tags the per-branch releases.
- [#1230](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1230) adopts git-cliff and [#1231](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1231) retires Release Drafter.
- [#780](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/780) adds the production Terraform workspace and [#782](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/782) promotes to it on a push to `main`.

## References

- [`infrastructure-branch-flow.md`](../reference/infrastructure-branch-flow.md): the branch-to-environment routing this record explains
- [`workflow-conventions.md`](../reference/workflow-conventions.md): which branches get push runs and why
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md): topic branch naming, commit format, and the squash strategy
- [A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/): the git flow model this one adapts
- [Issue #954](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/954): the request to record this decision
