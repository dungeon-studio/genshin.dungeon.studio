<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

<!-- vale Microsoft.HeadingAcronyms = NO -->

# REST API design conventions

<!-- vale Microsoft.HeadingAcronyms = YES -->

Use these conventions for `apps/api` routes to keep behavior predictable across endpoints.

## Source and scope

This reference defines the project's API design principles for representational state transfer (REST), informed by Mark Masse in [Masse2011].

## Principles

### 1. Resource-oriented paths

Model endpoints as resource nouns with stable, hierarchical paths. Use plural resource names and avoid action verbs in path segments.

### 2. Method semantics

Use each method by protocol intent in Hypertext Transfer Protocol (HTTP): `GET` for retrieval, `POST` for creation, `PUT` for full replacement, `PATCH` for partial update, and `DELETE` for removal.

### 3. Consistent status code semantics

Return meaningful status codes for both success and failure. Don't collapse errors into generic success responses.

See [RFC9110], Section 15: <https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes>

### 4. Predictable representation shapes

Representations should be explicit and negotiable through media types. Use content negotiation with `Accept` and `Content-Type`, align media type usage with [RFC6838], and define schemas that provide stable semantic structure for clients.

For `application/json` representations, provide a published JSON Schema for each request and response shape so semantics are discoverable.

See [RFC9110], Section 12: <https://www.rfc-editor.org/rfc/rfc9110.html#name-content-negotiation>

See [JSONSchema2020-12]: <https://json-schema.org/draft/2020-12>

#### `profile` parameter negotiation

Clients request a specific representation version using the `profile` parameter on the `Accept` header, referencing the schema URI that describes the expected response shape:

```http
GET /api/profile HTTP/1.1
Accept: application/json; profile="https://api.genshin.dungeon.studio/schemas/profile/get/1.0.0.json"
```

The API confirms the schema used in the response `Content-Type`:

```http
HTTP/1.1 200 OK
Content-Type: application/json; profile="https://api.genshin.dungeon.studio/schemas/profile/get/1.0.0.json"
```

Negotiation rules:

- **Profile omitted**: the API serves the latest representation version.
- **Profile matches a supported version**: the API responds with that representation.
- **Profile doesn't match any supported version**: the API responds with `406 Not Acceptable` using the RFC 9457 error format.
- **`Accept` doesn't include `application/json`** (or a wildcard): the API responds with `406 Not Acceptable`.

### 5. Consistent error contract

Use the Problem Details standard for machine-readable error responses. Return `application/problem+json` with stable fields and consistent extension members where needed.

Always include a `detail` field in every Problem Details response, even for generic errors such as `500 Internal Server Error` or `404 Not Found`. This ensures clients can parse the error body uniformly without branching on status code.

See [RFC9457]: <https://www.rfc-editor.org/rfc/rfc9457>

### 6. Consistent list behavior

Use explicit filtering parameters and cursor-based pagination with consistent query parameter names `limit` and `cursor`.

When using cursor pagination, the response representation must explicitly define cursor fields such as next and previous cursor tokens in its media type contract and published schema.

### 7. Authentication header convention

When authentication is active, use bearer tokens in the `Authorization` header and distinguish authentication `401` failures from authorization `403` failures.

See [RFC6750]: <https://www.rfc-editor.org/rfc/rfc6750>

### 8. Timestamp format

Encode API timestamps as ISO 8601 UTC strings.

### 9. Profile field ownership

Resources that combine data from multiple authorities define field ownership at the type level. Each field belongs to exactly one authority, and the API enforces ownership boundaries on write operations.

| Category       | Authority                        | API behavior                                   | Example fields                  |
| -------------- | -------------------------------- | ---------------------------------------------- | ------------------------------- |
| Identity       | Firebase Auth (`DecodedIdToken`) | Read-only; projected from the decoded ID token | `uid`, `email`, `emailVerified` |
| Profile        | Firestore                        | Mutable via `PATCH`                            | `name`                          |
| System-managed | Firestore                        | Set automatically; rejected in `PATCH` input   | `createdAt`, `updatedAt`        |

`PATCH` endpoints use `additionalProperties: false` in their JSON Schema to reject fields outside the mutable set.

### 10. Field naming

Use camelCase for all API response fields. When projecting fields from upstream types that use different conventions (for example, `DecodedIdToken.email_verified`), normalize casing at the translation boundary so clients see a consistent naming convention across all endpoints.

### 11. Validation status codes

Distinguish request parsing failures from schema validation failures:

- **400 Bad Request**: the server can't parse the request body as JSON.
- **422 Unprocessable Content**: the body is valid JSON but fails schema validation, such as a wrong shape, missing required fields, or extra properties.

See [RFC9110], Section 15.5.21: <https://www.rfc-editor.org/rfc/rfc9110.html#name-422-unprocessable-content>

### 12. Resource discovery

The API root (`GET /`) serves as a HATEOAS entry point that advertises available resources. The response contains a `links` object populated dynamically from the app's registered routes at startup using Hono's route introspection (`app.routes`):

```json
{
  "links": {
    "characters": { "href": "/api/characters" },
    "profile": { "href": "/api/profile" },
    "weapons": { "href": "/api/weapons" },
    "health": { "href": "/health" }
  }
}
```

The root response uses `application/json` with a `profile` parameter referencing its published JSON Schema, consistent with other API endpoints.

Design choices:

- **Link format**: a plain `links` object with `href` strings. Each key is the resource name derived from the last path segment. This avoids introducing a separate hypermedia media type for a single endpoint.
- **Dynamic extraction**: the app's route table at startup populates the links. New resource endpoints appear automatically without manual maintenance. The discovery logic filters to `GET` handlers on top-level paths, excluding the root itself, wildcard routes, and parameterized sub-resource paths.
- **Visibility**: all resources appear regardless of authentication status. URLs aren't secret; each resource enforces its own authorization.
- **Versioning**: the `/health` endpoint carries the API version alongside operational metadata like `status` and `sha`, not the root response. The root handles resource discovery only.
- **Route file**: the handler lives in `apps/api/src/routes/root.ts`. Mount it after all other routes so it can discover them.

## Repository scope

These principles guide route design, method semantics, status code usage, error shape, pagination, authentication header handling, and timestamp format for `apps/api`.

### References

<!-- vale Vale.Spelling = NO -->

- [Masse2011] Mark Masse. _REST API Design Rulebook_. O'Reilly Media, 2011. ISBN 978-1-4493-1050-9. <https://www.amazon.co.uk/REST-Design-Rulebook-Mark-Masse/dp/1449310508>
<!-- vale Vale.Spelling = YES -->
- [RFC9110] Nottingham, M., et al. _RFC 9110: HTTP Semantics_. IETF, 2022. Status codes: Section 15. <https://www.rfc-editor.org/rfc/rfc9110>
- [RFC6838] Freed, N., et al. _RFC 6838: Media Type Specifications and Registration Procedures_. IETF, 2013. <https://www.rfc-editor.org/rfc/rfc6838>
- [RFC9457] Nottingham, M., Wilde, E., and Dalal, S. _RFC 9457: Problem Details for HTTP APIs_. IETF, 2023. <https://www.rfc-editor.org/rfc/rfc9457>
- [RFC6750] Jones, M. and Hardt, D. _RFC 6750: The OAuth 2.0 Authorization Framework: Bearer Token Usage_. IETF, 2012. <https://www.rfc-editor.org/rfc/rfc6750>
- [JSONSchema2020-12] JSON Schema. _Draft 2020-12_. <https://json-schema.org/draft/2020-12>
- Supporting context: Richardson Maturity Model: <https://martinfowler.com/articles/richardsonMaturityModel.html>
