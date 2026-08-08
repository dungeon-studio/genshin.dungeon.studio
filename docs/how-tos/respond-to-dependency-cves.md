<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Respond to a vulnerable dependency

A vulnerable dependency surfaces two ways: the `Scan dependencies` job fails a
pull request, or a Dependabot alert appears in the Security tab. The gate's
floor is HIGH and CRITICAL, so an alert below it never fails CI.

---

## Reproduce the finding

Trivy looks for `trivy.yaml`, never the dot-prefixed name this repository uses,
so without `--config` the scan loads no severity floor and stops matching the
gate:

```bash
trivy fs --scanners vuln --config .trivy.yaml pnpm-lock.yaml
```

An alert with no matching CI failure sits below the floor. Drop the flag to
see it:

```bash
trivy fs --scanners vuln pnpm-lock.yaml
```

## Find what pulls the package in

```bash
pnpm why <package> -r
```

## Upgrade a direct dependency

This repository pins versions exactly, so set the new version in the owning
`package.json` and reinstall:

```bash
pnpm install
```

## Upgrade a transitive dependency

Bump the closest parent whose release widens the range—`pnpm why` names the
chain. If no parent has published one, leave it to Renovate.

A `pnpm.overrides` entry forces the version against a parent that never
resolved with it. Reserve it for a CRITICAL with no upstream timeline.

## Suppress an advisory with no fix

Add the advisory to `.trivyignore.yaml`:

```yaml
vulnerabilities:
  - id: CVE-2026-41907
    statement: >-
      Reached only through gaxios, which pins the vulnerable range; no
      upstream release fixes it. Revisit when firebase-admin ships a
      gaxios bump.
    expired_at: 2026-11-30
```

Set `expired_at` to when the finding is worth another look; Trivy stops
honouring the entry that day and the gate fails again.

Re-run the scan from the top of this guide before pushing.

## Related

- [Run Trivy scans](run-trivy-scans.md)—the Terraform, Dockerfile, and
  container image scans.
