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

See RFC 9110, Section 15: <https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes>

### 4. Predictable representation shapes

Representations should be explicit and negotiable through media types. Use content negotiation with `Accept` and `Content-Type`, and define schemas that provide stable semantic structure for clients.

For `application/json` representations, provide a published JSON Schema for each request and response shape so semantics are discoverable.

See RFC 9110, Section 12: <https://www.rfc-editor.org/rfc/rfc9110.html#name-content-negotiation>

See JSON Schema Draft 2020-12: <https://json-schema.org/draft/2020-12>

### 5. Consistent error contract

Use the Problem Details standard for machine-readable error responses. Return `application/problem+json` with stable fields and consistent extension members where needed.

See RFC 9457: <https://www.rfc-editor.org/rfc/rfc9457>

### 6. Consistent list behavior

Use explicit filtering parameters and cursor-based pagination with consistent query parameter names `limit` and `cursor`.

When using cursor pagination, the response representation must explicitly define cursor fields such as next and previous cursor tokens in its media type contract and published schema.

### 7. Authentication header convention

When authentication is active, use bearer tokens in the `Authorization` header and distinguish authentication `401` failures from authorization `403` failures.

See RFC 6750: <https://www.rfc-editor.org/rfc/rfc6750>

### 8. Timestamp format

Encode API timestamps as ISO 8601 UTC strings.

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
