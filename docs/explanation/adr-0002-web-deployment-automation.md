---
status: superseded by ADR-0004
date: 2026-02-15
decision-makers: Alex Brandt
---

# Web deployment automation pipeline

## Context and problem statement

Deploying the web application to Google Cloud Storage takes coordinated steps: build, upload, set cache headers, and verify. Manual deployments are error-prone and leave inconsistent deployment states. How should a pipeline triggered by merge to `develop` verify, cache, and sequence a deployment?

[ADR-0004](adr-0004-firebase-hosting-migration.md) moved hosting to Firebase Hosting and kept the verification and cache decisions recorded here.

## Decision drivers

- The same steps every time, with no manual configuration
- Confirmation that a deployment succeeded before treating it as complete
- Checks that survive framework upgrades and cache strategy changes

## Considered options

Three decisions, each with its own options:

- Verification: layered structural and commit hash checks, content validation, HTTP header validation, or none
- Caching: `ETag` revalidation with `stale-while-revalidate`, time-based `max-age`, no cache, or a service worker
- Trigger: `workflow_run` on Terraform Apply, a manual trigger, a single workflow, or a push trigger on `develop`

## Decision outcome

### Verify with layered checks

Chosen option: structural verification before deployment and commit hash comparison after it.

- Before deployment, `apps/web/scripts/verify-build-output.sh` checks that `dist/`, `index.html`, `assets/`, and `version.json` exist.
- A Vite plugin in `apps/web/vite.config.ts` writes `dist/version.json` with the commit hash, version, and timestamp.
- After deployment, `apps/web/scripts/verify-deployment.sh` fetches the deployed `version.json` and compares its hash to `git rev-parse --short HEAD`.

### Revalidate pages and keep assets immutable

Chosen option: `Cache-Control: public, no-cache, stale-while-revalidate=86400` for HTML and `public, max-age=31536000, immutable` for assets.

- `no-cache` forces revalidation, so a deploy reaches users through 304 Not Modified responses.
- `stale-while-revalidate` serves cached HTML while fetching an update if the server is unreachable.
- Vite's content-hashed filenames make a one-year `immutable` cache safe for assets.

### Deploy after the infrastructure apply succeeds

Chosen option: a `workflow_run` trigger starts deployment after Terraform Apply succeeds on `develop`, so infrastructure exists before deployment starts.

### Consequences

- Good, because build verification fails early, before a deploy wastes time.
- Good, because anyone can inspect deployment state by fetching `/version.json`.
- Bad, because structural checks catch only structural build errors and can't verify cache headers.
- Bad, because HTML carries a one-day revalidation window.

## Pros and cons of the options

### Verification options

Layered structural and commit hash checks:

- Good, because neither check depends on cache headers, bundle names, or similar details.
- Good, because the hash comparison proves the expected code is live.

Content validation:

- Bad, because it couples to Vite and React internals and breaks with framework upgrades.

HTTP header validation:

- Bad, because it couples to the cache strategy, so a header change breaks verification.

No verification:

- Bad, because broken code and broken deployments ship.

### Caching options

`ETag` revalidation with `stale-while-revalidate`:

- Good, because updates reach users on the next request.
- Good, because cached HTML still serves if the server is unreachable.

Time-based `max-age` on HTML:

- Bad, because it delays users seeing a deploy and is less reliable.
- Bad, because the HTTP/1.0 `Expires` header is obsolete, and `max-age=0` on HTML creates unnecessary cache requests.
- Bad, because `must-revalidate` adds nothing that `no-cache` doesn't already give, and `no-cache` is simpler and standard.

No cache:

- Bad, because every request pays the endpoint overhead, which worsens performance.

Service worker:

- Bad, because it adds complexity that correct headers make unnecessary for early deployments.

### Trigger options

`workflow_run` on Terraform Apply:

- Good, because infrastructure always exists before deployment starts.

Manual trigger:

- Bad, because it adds friction, invites errors, and defeats the automation goal.

Single workflow:

- Bad, because it mixes infrastructure and application concerns and is harder to debug.

Push trigger on `develop`:

- Bad, because deployment races infrastructure that isn't ready yet.

## More information

- [ADR-0004](adr-0004-firebase-hosting-migration.md) supersedes this decision by migrating web hosting to Firebase Hosting.
- [ADR-0001](adr-0001-wif-architecture.md) covers how the pipeline authenticates to Google Cloud.
- [`Cache-Control` header reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
