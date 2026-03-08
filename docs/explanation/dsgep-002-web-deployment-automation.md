<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# DSGEP-002: Web deployment automation pipeline

This Dungeon Studio Genshin Enhancement Proposal (DSGEP) describes the automated deployment pipeline for the web application to Google Cloud Storage.

- **Status**: Superseded by [DSGEP-004](dsgep-004-firebase-hosting-migration.md)
- **Created**: 2026-02-15
- **Authors**: Alex Brandt

## Problem

Deploying the web application requires multiple coordinated steps: build, upload to Cloud Storage, set cache headers, verify success. Manual deployments are error-prone and create inconsistent deployment states. The team needs an automated pipeline that:

1. **Maintains consistency**: Same steps every time, no manual configuration
2. **Verifies correctness**: Confirms deployment succeeded before considering it complete

## Solution overview

A three-stage automated pipeline triggered by merge to `develop`:

1. **Terraform Apply**: Creates/updates infrastructure
2. **Build & Deploy**: Builds web app and uploads to Cloud Storage with cache headers
3. **Verification**: Confirms deployed version matches current git `HEAD`

## Decision points

### 1. Verification strategy: Layered checks

**Decision:** use structural verification before deployment and Secure Hash Algorithm (SHA) comparison after deployment to confirm build quality and that the correct code is live.

**Rationale:**

- **Early failure detection**: Build verification catches errors before wasting time on deployment
- **Straightforward and reliable**: Both checks avoid implementation coupling. Don't depend on cache headers, bundle names, or similar details.
- **Observable**: Anyone can inspect deployment state via `curl http://develop.genshin.dungeon.studio/version.json`

**Why not alternatives:**

- ❌ **Content validation**: Too coupled to Vite/React internals; breaks with framework upgrades
- ❌ **HTTP header validation**: Too coupled to cache strategy; if headers change, verification breaks
- ❌ **No verification**: Lets broken code and broken deployments ship

**Implementation:**

**Build verification before deployment:**

- Script: `apps/web/scripts/verify-build-output.sh`
- Checks that `dist/`, `index.html`, `assets/`, and `version.json` exist
- Goal: Make sure the build ran and produced the expected structure

**Deployment verification after deployment:**

- Plugin: `apps/web/vite.config.ts` generates `dist/version.json` with git SHA, version, timestamp
- Script: `apps/web/scripts/verify-deployment.sh` fetches deployed `version.json` and compares SHA to `git rev-parse --short HEAD`
- Goal: Prove the expected code is live, not something else

**Generated artifact:**

```json
{
  "sha": "a1b2c3d4",
  "version": "0.1.0",
  "timestamp": "2026-02-15T10:30:00.000Z"
}
```

### 2. Cache strategy: `ETag` + stale-while-revalidate

**Decision:** use `Cache-Control: public, no-cache, stale-while-revalidate=86400` for HTML; `max-age=31536000, immutable` for assets.

**Rationale:**

| Concern               | Solution                       | Benefit                                                                   |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| **HTML staleness**    | `no-cache` forces revalidation | Updates deployed immediately via 304 Not Modified responses               |
| **Update resilience** | `stale-while-revalidate`       | If server unreachable, serve cached HTML while fetching update            |
| **Asset efficiency**  | `immutable` + Vite hashing     | 1-year cache safe; content hash means old files never match new filenames |

**Why not pure time-based caching?**

- HTTP/1.0 `Expires` header is obsolete
- `max-age=0` on HTML creates unnecessary cache requests
- `must-revalidate` adds no value; `no-cache` is simpler and standard

**Alternatives considered:**

- ❌ **Time-based cache with max-age=X**: Adds delay between deploy and user seeing update; less reliable
- ❌ **No cache**: API endpoint overhead; worse performance
- ❌ **Service Worker**: Adds complexity for early deployments; not needed with proper headers

**Implementation:** `apps/web/scripts/deploy-to-cloud-storage.sh` sets cache headers during `gsutil cp` via `-h` flag:

- HTML files: `Cache-Control: public, no-cache, stale-while-revalidate=86400`
- Asset files: `Cache-Control: public, max-age=31536000, immutable`

### 3. Deployment automation trigger: `workflow_run` on Terraform Apply

**Decision:** use GitHub Actions `workflow_run` trigger to start deployment after Terraform Apply succeeds.

**Rationale:**

- **Ordered execution**: Makes sure infrastructure exists before deployment starts

**Alternatives considered:**

- ❌ **Manual trigger**: Adds friction, invites errors, and defeats the automation goal
- ❌ **Single workflow**: Would mix infrastructure and application concerns; harder to debug
- ❌ **Push trigger on develop**: Race condition: code pushed before infrastructure ready

**Implementation:** `.github/workflows/deploy.yml` uses:

```yaml
on:
  workflow_run:
    workflows: ['Terraform Apply']
    types: [completed]
    branches: [develop]
```

## Implementation

### Workflow stages

```text
Developer: git push to feature-branch
    ↓
GitHub Actions: Tests run in existing CI
    ↓
Developer: Create PR to develop
    ↓
GitHub Actions: Terraform Plan (.terraform-plan.yml)
    ├─ Plans core infrastructure
    └─ Plans dev infrastructure
    ↓
Reviewer: Approve & merge PR
    ↓
GitHub Actions: Terraform Apply (.terraform-apply.yml)
    ├─ Applies core infrastructure (DNS zone)
    └─ Applies dev infrastructure (bucket, DNS CNAME record)
    ↓
GitHub Actions: Deploy Web (.deploy.yml) [triggered by workflow_run]
    ├─ Build web app
    ├─ Verify build output (structure + version.json)
    ├─ Deploy to Cloud Storage (with cache headers)
    └─ Verify deployment (SHA comparison)
    ↓
Site live at: http://develop.genshin.dungeon.studio/
```

### Files Involved

**Infrastructure:**

- `infrastructure/terraform/environments/dev/web.tf`: Cloud Storage bucket for the web application
- `infrastructure/terraform/environments/core/dns_record_set_develop.tf`: Domain Name System configuration for develop.genshin.dungeon.studio

**Application:**

- `apps/web/vite.config.ts`: Vite plugin generates version.json
- `apps/web/scripts/verify-build-output.sh`: Validates build artifacts
- `apps/web/scripts/deploy-to-cloud-storage.sh`: Uploads with cache headers
- `apps/web/scripts/verify-deployment.sh`: Confirms deployment succeeded

**Workflows:**

- `.github/workflows/terraform-plan.yml`
- `.github/workflows/terraform-apply.yml`
- `.github/workflows/deploy.yml`: Triggered by terraform-apply success

## Trade-offs

| Aspect                    | Choice                             | Trade-off                                                                               |
| ------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| **Verification strategy** | Structural checks + SHA comparison | Doesn't catch all build errors, only structural ones; can't verify cache headers        |
| **Cache headers**         | no-cache + stale-while-revalidate  | Requires a 1-day revalidation window                                                    |
| **Bucket location**       | `EU` (multi-region)                | Geo-redundant storage; slightly higher latency from non-EU regions (acceptable for dev) |

## Future considerations

### Staging & production deployments

Current pipeline is dev-only. To add staging/production:

1. Create `infrastructure/terraform/environments/staging/` and `production/`
2. Parameterize deployment script with bucket name
3. Create separate deploy workflows triggered by tags/branches

**No changes needed to core strategy.**

### Monitoring & observability

Current logging is console-only. Future additions:

- Structured JSON logging to Cloud Logging
- Deployment metrics to Cloud Monitoring
- Alerts for failed deployments

**No architectural changes needed. This is an additive layer.**

### Beyond GitHub Actions

If moving to different CI/CD:

- Workflow orchestration differs, but pipeline stages remain same
- Terraform runs identically anywhere
- Deployment scripts are shell-based and portable

**Architecture is CI/CD-agnostic.**

## Verification

Verify deployment via:

1. **Build verification in deploy workflow:**

   ```bash
   bash apps/web/scripts/verify-build-output.sh
   ```

2. **Deployment verification in deploy workflow:**

   ```bash
   bash apps/web/scripts/verify-deployment.sh http://develop.genshin.dungeon.studio
   ```

   Compares deployed `version.json` SHA to `git rev-parse --short HEAD`

3. **Manual verification after deployment:**

   ```bash
   curl http://develop.genshin.dungeon.studio/version.json | jq .sha
   git rev-parse --short HEAD  # should match
   ```

## References

- [dsgep-001-wif-architecture.md](dsgep-001-wif-architecture.md): Related: GCP authentication strategy
- [Cache Control Headers (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Cloud Storage Static Website Hosting](https://cloud.google.com/storage/docs/hosting-static-website)
- [SPA Routing in Static Hosting](https://firebase.google.com/docs/hosting/redirect-behavior#spa)

## See also

- How-to: [Manually Redeploy the Web App](../how-tos/deploy-web-to-cloud-storage.md)
