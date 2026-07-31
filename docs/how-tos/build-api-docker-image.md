<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Build the API Docker image

This guide covers building and running the `apps/api` Docker image locally.

---

## Build

```bash
docker build -f apps/api/Dockerfile -t genshin-api:local .
```

## Run

```bash
docker run -p 8080:8080 genshin-api:local
```

The API is available at `http://localhost:8080`. See [`apps/api/Dockerfile`](../../apps/api/Dockerfile) for build details and [`.github/workflows/`](../../.github/workflows/) for CI/CD pipeline information.
