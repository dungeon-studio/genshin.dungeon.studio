<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Manually redeploy the web app

When you need to redeploy the web application without merging code—for example, after fixing a configuration or to force a new deployment.

**Note**: in normal workflow, redeployment happens automatically when you merge to `develop`. See [DSGEP-002: web deployment automation pipeline](../explanation/dsgep-002-web-deployment-automation.md) for how the automated pipeline works.

**Environment**: this guide uses the development environment as an example. For staging or production, substitute the appropriate GCP project and Cloud Storage bucket names in the commands below.

## Prerequisites

- Google Cloud CLI: `gcloud auth login` (authenticated with dev project access)
- Access to `dungeon-studio-genshin-dev` GCP project
- Local pnpm installation
- Bash shell

## Steps

### 1. Build the web app

```bash
pnpm --filter @genshin/web build
```

Generates `apps/web/dist/` with compiled app and `version.json` containing deployment metadata.

### 2. Deploy to Cloud Storage

```bash
bash apps/web/scripts/deploy-to-cloud-storage.sh develop.genshin.dungeon.studio
```

This script:

- Uploads all files from `dist/` to the bucket
- Sets HTML cache headers: `Cache-Control: public, no-cache, stale-while-revalidate=86400`
- Sets asset cache headers: `Cache-Control: public, max-age=31536000, immutable`

### 3. Verify deployment

```bash
bash apps/web/scripts/verify-deployment.sh http://develop.genshin.dungeon.studio
```

Compares the deployed version Secure Hash Algorithm (SHA) with your current git `HEAD`. Exits successfully if they match.

## Done

Your web app is now deployed to <http://develop.genshin.dungeon.studio/>
