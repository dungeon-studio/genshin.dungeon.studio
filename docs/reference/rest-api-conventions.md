<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

<!-- vale Microsoft.HeadingAcronyms = NO -->

# REST API design conventions

<!-- vale Microsoft.HeadingAcronyms = YES -->

Representational state transfer (REST) conventions for `apps/api` routes, so behavior stays predictable across endpoints. Informed by Mark Masse in [Masse2011].

## Principles

### 1. Resource-oriented paths

Model endpoints as plural resource nouns on stable, hierarchical paths. No action verbs in path segments.

### 2. Method semantics

Use each method by its HTTP intent: `GET` retrieves, `POST` creates, `PUT` replaces in full, `PATCH` updates in part, `DELETE` removes.

### 3. Consistent status code semantics

Return meaningful status codes for success and failure alike. Don't collapse errors into generic success responses.

See [RFC9110], Section 15: <https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes>

### 4. Predictable representation shapes

Negotiate representations through media types with `Accept` and `Content-Type`, following [RFC6838]. Every `application/json` request and response shape carries a published JSON Schema, so its semantics are discoverable.

See [RFC9110], Section 12: <https://www.rfc-editor.org/rfc/rfc9110.html#name-content-negotiation>

See [JSONSchema2020-12]: <https://json-schema.org/draft/2020-12>

#### `profile` parameter negotiation

Clients select a representation version with the `profile` parameter on `Accept`, naming the schema URI they expect. The API echoes the schema it used in the response `Content-Type`:

```http
GET /profile HTTP/1.1
Accept: application/json; profile="https://api.genshin.dungeon.studio/profiles/json-schema/profile/get-response-v1.json"

HTTP/1.1 200 OK
Content-Type: application/json; profile="https://api.genshin.dungeon.studio/profiles/json-schema/profile/get-response-v1.json"
```

Negotiation rules:

- **Profile omitted**: serves the latest representation version.
- **Profile matches a supported version**: responds with that representation.
- **Profile matches no supported version**: responds `406 Not Acceptable` in the RFC 9457 error format.
- **`Accept` excludes `application/json`** (and any wildcard): responds `406 Not Acceptable`.

### 5. Consistent error contract

Return errors as `application/problem+json` with stable fields and consistent extension members where needed. Every response includes a `detail` field, even generic ones such as `500 Internal Server Error` or `404 Not Found`, so clients parse error bodies uniformly without branching on status code.

Clients branch on `type`, which classifies the failure; `detail` carries a human-readable message whose wording isn't part of the contract. Errors with no narrower classification use `about:blank`.

Request body validation classifies against this vocabulary:

| `type`                                       | Meaning                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `/problems/validation/missing-property`      | A required property is absent.                          |
| `/problems/validation/invalid-type`          | A property holds a value of the wrong type.             |
| `/problems/validation/out-of-range`          | A value falls outside a numeric, length, or size bound. |
| `/problems/validation/additional-properties` | The body carries a property the schema doesn't define.  |
| `/problems/validation`                       | The failure spans several categories, or fits none.     |

These URIs identify failure modes and don't resolve to a document.

See [RFC9457]: <https://www.rfc-editor.org/rfc/rfc9457>

### 6. Consistent list behavior

Paginate with cursors under the query parameter names `limit` and `cursor`, and filter through explicit parameters. The response's media type contract and published schema define its cursor fields, including next and previous tokens.

### 7. Authentication header convention

When authentication is active, carry bearer tokens in the `Authorization` header and distinguish authentication failures (`401`) from authorization failures (`403`).

See [RFC6750]: <https://www.rfc-editor.org/rfc/rfc6750>

### 8. Timestamp format

Encode API timestamps as ISO 8601 UTC strings.

### 9. Profile field ownership

Resources combining data from multiple authorities assign each field to exactly one authority at the type level, and the API enforces that boundary on writes.

| Category       | Authority                        | API behavior                                   | Example fields                  |
| -------------- | -------------------------------- | ---------------------------------------------- | ------------------------------- |
| Identity       | Firebase Auth (`DecodedIdToken`) | Read-only; projected from the decoded ID token | `uid`, `email`, `emailVerified` |
| Profile        | Firestore                        | Mutable via `PATCH`                            | `name`                          |
| System-managed | Firestore                        | Set automatically; rejected in `PATCH` input   | `createdAt`, `updatedAt`        |

`PATCH` endpoints use `additionalProperties: false` in their JSON Schema to reject fields outside the mutable set.

### 10. Field naming

All API response fields are camelCase. Normalize casing at the translation boundary when projecting from upstream types that use other conventions (for example, `DecodedIdToken.email_verified`).

### 11. Validation status codes

Distinguish request parsing failures from schema validation failures:

- **400 Bad Request**: the server can't parse the request body as JSON.
- **422 Unprocessable Content**: the body is valid JSON but fails schema validation, such as a wrong shape, missing required fields, or extra properties.

See [RFC9110], Section 15.5.21: <https://www.rfc-editor.org/rfc/rfc9110.html#name-422-unprocessable-content>

### 12. Resource discovery

The API root (`GET /`) is a hypermedia entry point (HATEOAS) advertising available resources as a `links` object, served as `application/json` with a `profile` parameter like every other endpoint:

```json
{
  "links": {
    "characters": { "href": "/characters" },
    "profile": { "href": "/profile" },
    "teams": { "href": "/teams" },
    "weapons": { "href": "/weapons" },
    "health": { "href": "/health" }
  }
}
```

- **Link shape**: plain `href` strings keyed by the last path segment.
- **Population**: derived at startup, so new resource endpoints appear without manual maintenance.
- **Visibility**: every resource, authenticated or not; each enforces its own authorization.
- **Version**: carried by `/health` alongside operational metadata such as `status` and `sha`.

### 13. Retry-After on 429 and 503 responses

These statuses carry a `Retry-After` header, an integer count of seconds, keyed on the response status alone and independent of what produced it. Every other error status omits the header.

| Status | Meaning                                             |
| ------ | --------------------------------------------------- |
| `429`  | Quota or rate limit exhausted; wait before retrying |
| `503`  | Service momentarily unavailable; retry shortly      |

See [RFC9110], Section 10.2.3: <https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after>

### 14. Method discovery via OPTIONS

The root response advertises resources without method hints, so a client learns what one supports by sending it `OPTIONS`. Derive the `Allow` list from the routing table rather than maintaining a method list per route by hand. `OPTIONS` answers before authentication, because a browser preflight carries no credentials.

See [RFC9110], Section 9.3.7: <https://www.rfc-editor.org/rfc/rfc9110.html#name-options> and Section 10.2.1: <https://www.rfc-editor.org/rfc/rfc9110.html#name-allow>

## References

<!-- vale Vale.Spelling = NO -->

- [Masse2011] Mark Masse. _REST API Design Rulebook_. O'Reilly Media, 2011. ISBN 978-1-4493-1050-9. <https://www.amazon.co.uk/REST-Design-Rulebook-Mark-Masse/dp/1449310508>

<!-- vale Vale.Spelling = YES -->

- [RFC9110] Nottingham, M., et al. _RFC 9110: HTTP Semantics_. IETF, 2022. <https://www.rfc-editor.org/rfc/rfc9110>
- [RFC6838] Freed, N., et al. _RFC 6838: Media Type Specifications and Registration Procedures_. IETF, 2013. <https://www.rfc-editor.org/rfc/rfc6838>
- [RFC9457] Nottingham, M., Wilde, E., and Dalal, S. _RFC 9457: Problem Details for HTTP APIs_. IETF, 2023. <https://www.rfc-editor.org/rfc/rfc9457>
- [RFC6750] Jones, M. and Hardt, D. _RFC 6750: The OAuth 2.0 Authorization Framework: Bearer Token Usage_. IETF, 2012. <https://www.rfc-editor.org/rfc/rfc6750>
- [JSONSchema2020-12] JSON Schema. _Draft 2020-12_. <https://json-schema.org/draft/2020-12>
- Supporting context: Richardson Maturity Model: <https://martinfowler.com/articles/richardsonMaturityModel.html>
