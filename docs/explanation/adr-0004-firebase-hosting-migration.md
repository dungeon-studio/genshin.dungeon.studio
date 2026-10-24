---
status: accepted
date: 2026-03-06
decision-makers: Alex Brandt
supersedes: ADR-0002
---

# Migrate web hosting to Firebase Hosting

## Context and problem statement

The web application ran on a public Google Cloud Storage bucket behind a canonical name (CNAME) DNS record, as [ADR-0002](adr-0002-web-deployment-automation.md) set up. Cloud Storage static website hosting via a custom domain only supports HTTP. That blocks Google Authentication, because Firebase Auth requires HTTPS origins. Issue [#386](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/386) tracked the change.

## Decision drivers

- HTTPS on the custom domain, so Firebase Auth can use it as an origin

## Considered options

- Firebase Hosting
- Cloud Storage static website hosting, the existing setup

## Decision outcome

Chosen option: Firebase Hosting, because it provides HTTPS by default with managed certificates. It also brings single-page app rewrites, declarative header configuration via `firebase.json`, and a global content delivery network (CDN), but HTTPS is the reason for the move.

The verification and cache decisions from ADR-0002 carry over unchanged: structural build checks plus a commit hash comparison, and the same `Cache-Control` values for HTML, assets, and `version.json`. What changes:

| Aspect           | ADR-0002 (Cloud Storage)                                      | ADR-0004 (Firebase Hosting)                                  |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| Hosting          | Storage bucket with public IAM binding                        | Firebase Hosting site                                        |
| Protocol         | HTTP only                                                     | HTTPS with managed certificates                              |
| Deploy mechanism | `gsutil rsync` + `gsutil setmeta` script                      | `FirebaseExtended/action-hosting-deploy` GitHub Action       |
| Cache config     | Imperative, via deploy script                                 | Declarative, via `firebase.json`                             |
| Routing          | `not_found_page` serves `index.html` with 404, a bucket limit | Rewrite rule serves `index.html` with 200, correct for a SPA |
| CDN              | None, single-region bucket                                    | Firebase global CDN                                          |
| DNS              | CNAME to `c.storage.googleapis.com.`                          | CNAME to `dungeon-studio-genshin-dev.web.app.`               |

### Consequences

- Good, because the custom domain serves HTTPS, unblocking Firebase Auth.
- Good, because Firebase manages the CDN and certificates.
- Bad, because the catch-all rewrite to `index.html` means no server-side 404 responses, so the client handles unknown routes.
- Bad, because the site depends on Firebase.
- Bad, because Firebase Hosting Terraform resources are beta-only and need the `google-beta` provider.

## More information

- [ADR-0001](adr-0001-wif-architecture.md) covers how the pipeline authenticates to Google Cloud.
- [Firebase Hosting documentation](https://firebase.google.com/docs/hosting)
- [`Cache-Control` header reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
