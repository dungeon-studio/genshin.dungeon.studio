<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# DSGEP-004: Migrate web hosting to Firebase Hosting

This Dungeon Studio Genshin Enhancement Proposal (DSGEP) describes the migration of the web application hosting from Google Cloud Storage to Firebase Hosting. It supersedes [DSGEP-002](dsgep-002-web-deployment-automation.md).

- **Status**: Accepted
- **Created**: 2026-03-06
- **Authors**: Alex Brandt
- **Supersedes**: [DSGEP-002](dsgep-002-web-deployment-automation.md)
- **Issue**: [#386](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/386)

## Problem

The web application was hosted on a public Google Cloud Storage bucket with a CNAME DNS record. Cloud Storage static website hosting via custom domain only supports HTTP, which blocks configuring Google Authentication integration (Firebase Auth requires HTTPS origins).

## Decision

Migrate to Firebase Hosting, which provides HTTPS by default with managed SSL certificates. Firebase Hosting also brings SPA rewrites, declarative header configuration via `firebase.json`, and a global CDN, but the primary driver is HTTPS support.

## Changes from DSGEP-002

### What stays the same

- **Verification strategy**: Structural build checks + SHA comparison (unchanged)
- **Cache strategy**: Same Cache-Control values for HTML, assets, and `version.json`
- **Automation trigger**: Deploy workflow triggered by Terraform Apply success

### What changes

| Aspect               | DSGEP-002 (Cloud Storage)                                      | DSGEP-004 (Firebase Hosting)                                     |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Hosting**          | GCS bucket with public IAM binding                             | Firebase Hosting site                                            |
| **Protocol**         | HTTP only                                                      | HTTPS with managed SSL                                           |
| **Deploy mechanism** | `gsutil rsync` + `gsutil setmeta` script                       | `FirebaseExtended/action-hosting-deploy` GitHub Action           |
| **Cache config**     | Imperative via deploy script                                   | Declarative via `firebase.json`                                  |
| **SPA routing**      | `not_found_page` serves `index.html` with 404 (GCS limitation) | Rewrite rule serves `index.html` with 200 (correct SPA behavior) |
| **CDN**              | None (single-region bucket)                                    | Firebase global CDN                                              |
| **DNS**              | CNAME to `c.storage.googleapis.com.`                           | CNAME to `dungeon-studio-genshin-dev.web.app.`                   |

## Trade-offs

| Aspect                  | Choice                                | Trade-off                                                      |
| ----------------------- | ------------------------------------- | -------------------------------------------------------------- |
| **SPA rewrites**        | Catch-all rewrite to `index.html`     | No server-side 404 responses; client handles unknown routes    |
| **Firebase dependency** | Firebase Hosting instead of raw GCS   | Adds Firebase as a dependency; offloads CDN and SSL management |
| **Beta provider**       | `google-beta` for Terraform resources | Firebase Hosting Terraform resources are beta-only             |

## References

- [DSGEP-002: Web deployment automation pipeline](dsgep-002-web-deployment-automation.md): Superseded proposal
- [DSGEP-001: WIF architecture](dsgep-001-wif-architecture.md): GCP authentication strategy
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Cache Control Headers (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
