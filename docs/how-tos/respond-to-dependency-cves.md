<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Respond to a vulnerable dependency

A vulnerable dependency surfaces two ways: the `Scan dependencies` job fails a
pull request on a HIGH or CRITICAL advisory in `pnpm-lock.yaml`, or a
Dependabot alert appears in the Security tab. Both end in the same three
options—upgrade, wait for the upstream fix, or suppress.

---

## Reproduce the finding

```bash
trivy fs --scanners vuln pnpm-lock.yaml
```

An alert with no matching CI failure is below the gate's floor. Widen the
scan to see it:

```bash
trivy fs --scanners vuln --severity MEDIUM,HIGH,CRITICAL pnpm-lock.yaml
```

## Find what pulls the package in

```bash
pnpm why <package> -r
```

## Upgrade a direct dependency

Versions are pinned exactly, so set the new version in the owning
`package.json` and reinstall:

```bash
pnpm install
```

## Upgrade a transitive dependency

Bump the closest parent whose release widens the range—`pnpm why` names the
chain. If no parent has published one, leave it to Renovate, which opens a
`security`-labelled pull request as soon as a fix lands.

A `pnpm.overrides` entry forces the version instead, against a parent that
never resolved with it. Reserve that for a CRITICAL with no upstream timeline.

## Suppress an advisory with no fix

Add the advisory to `.trivyignore.yaml` under `vulnerabilities`, with the
justification and expiry that file requires:

```yaml
vulnerabilities:
  - id: CVE-2026-41907
    statement: >-
      Reached only through gaxios, which pins the vulnerable range; no
      upstream release fixes it. Revisit when firebase-admin ships a
      gaxios bump.
    expired_at: 2026-11-30
```

Set `expired_at` to when the finding is worth another look. Trivy stops
honouring the entry that day and the gate fails again, which is what stops a
suppression becoming permanent.

Confirm the gate passes before pushing:

```bash
trivy fs --scanners vuln --exit-code 1 pnpm-lock.yaml
```

## Related

- [Run Trivy scans](run-trivy-scans.md)—the Terraform, Dockerfile, and
  container image scans.
