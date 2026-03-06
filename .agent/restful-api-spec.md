## API Contract Guideline

> Source: https://populix.atlassian.net/wiki/spaces/TG/pages/3192061965/DS-001+-+RESTful+API+Specification

### 1. Scope

This RFC establishes a unified standard for designing, implementing, deploying, and documenting RESTful APIs across all engineering teams. The goal is to ensure consistency, reliability, long-term maintainability, and predictable consumer behavior across internal and external services.

This standard applies to all new APIs and all existing APIs undergoing modifications.

### 2. Normative References

The following references are normative and binding for this RFC:

- Microsoft REST API Guidelines  
  `https://github.com/microsoft/api-guidelines`
- RFC 7231 – Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content  
  `https://www.rfc-editor.org/rfc/rfc7231`
- RFC 3986 – Uniform Resource Identifier (URI): Generic Syntax  
  `https://www.rfc-editor.org/rfc/rfc3986`

These documents take precedence for ambiguous or undefined behavior.

### 3. Design Principles

- **Contract-First Design**  
  API contract MUST be defined before implementation and MUST be defined in OpenAPI format.

- **Consistency**  
  All services MUST adhere to shared naming, structure, and behavior.

- **Statelessness**  
  As defined in RFC 7231, each request MUST contain all information necessary to process the request.

- **Resource Orientation**  
  APIs MUST model nouns (resources), not verbs.

- **Backwards Compatibility**  
  Existing API versions MUST NOT introduce breaking changes.

### 4. URI and Resource Modeling

Reference: RFC 3986, Microsoft API Guidelines Section 6.

#### 4.1 URI Format

All URIs MUST:

- Use HTTPS
- Use lowercase
- Use hyphens as word separators
- Represent resources as plural nouns, not verbs

**Examples (valid):**

- `GET /users`
- `PATCH /projects/{projectId}/surveys`

The following MUST NOT be used:

- Verbs in paths
- Uppercase characters
- Underscores or camelCase in paths
- Invalid resource order

**Examples (invalid):**

- `GET /getUsers`
- `PATCH /project/surveys/{id}`
- `PATCH /surveys/{id}/project`

#### 4.2 URL Nesting

Resource nesting MUST NOT exceed two levels.

- **Allowed:**  
  `/projects/{id}/surveys`

- **Not allowed:**  
  `/projects/{id}/surveys/{id}/segment/{pid}/submission/{id}`

#### 4.3 Action Endpoints

Non-CRUD operations MUST be implemented using sub-resource action endpoints:

**Allowed:**

- `POST /surveys/{id}/activate` – to activate survey
- `POST /payments/{id}/refund` – to refund payment
- `POST /users/{id}/blacklist` – to blacklist user

Action endpoints MUST use `POST`.

**Not allowed:**

```http
POST /surveys/{id}   # to activate survey
Body:
{
  "action": "ACTIVATE"
}
```

### 5. Response Envelope & Base Model

All API responses (success and error) MUST use a consistent JSON envelope with the following structure:

```json
{
  "traceId": "019cb786-44a7-74da-88d9-0375c5f8c7de",
  "metadata": {
    "...": "pagination metadata"
  },
  "error": {
    "...": "error metadata (see section 11)"
  },
  "result": {
    "...": "domain-specific result model"
  }
}
```

Rules:

- `traceId`
  - MUST be present in every response.
  - SHOULD match the `Request-Id` header when provided.
  - MUST be a string identifier (typically UUID) used for tracing and debugging.

- `metadata`
  - MAY be omitted or `null` when not applicable.
  - SHOULD contain pagination and other response-level metadata (e.g., `page`, `limit`, `total`, `cursor`, `hasNext`).
  - MUST NOT contain domain data that belongs in `result`.

- `error`
  - MUST be `null` or omitted on successful responses.
  - MUST be populated for error responses and follow the error schema defined in section 11.
  - When `error` is present, `result` SHOULD be `null` or omitted.

- `result`
  - MUST contain the domain-specific response model on success (object or array).
  - MUST be `null` or omitted when an error occurs.

Field naming inside both `metadata` and `result` MUST follow `camelCase` convention.

### 6. HTTP Methods and Semantics

Reference: RFC 7231 Section 4.

| Method | Semantic Meaning                  | Idempotent | Request Body | Typical Usage     |
| ------ | --------------------------------- | ---------: | -----------: | ----------------- |
| GET    | Retrieve resource(s)              |        Yes |           No | Listing, detail   |
| POST   | Create resource or perform action |         No |          Yes | Creation, actions |
| PUT    | Replace full resource             |        Yes |          Yes | Full update       |
| PATCH  | Partial update                    | Optional\* |          Yes | Partial update    |
| DELETE | Remove resource                   |        Yes |     Optional | Deletion          |

\* **PATCH idempotency**: SHOULD be idempotent if designed as state replacement.

Servers MUST adhere strictly to HTTP semantics.

### 7. Query Parameters

Reference: RFC 3986 Section 3.4.

Query parameters are used only to modify how a resource is retrieved, not to perform actions or encode business logic. They must be:

- Predictable
- Explicit
- Secure
- Backward compatible

#### 7.1 Naming Convention

Query parameter conventions:

- MUST use `camelCase`
- MUST use descriptive names
- SHOULD avoid abbreviations

**Allowed:**

- `?createdAfter=2024-01-01`

**Not allowed:**

- `?ca=2024`

#### 7.2 Accepted Use Case

Query parameters MAY ONLY be used for:

| Use Case        | Example                  |
| --------------- | ------------------------ |
| Filtering       | `?status=ACTIVE`         |
| Pagination      | `?limit=20&cursor=abc`   |
| Sorting         | `?sort=createdAt:desc`   |
| Field selection | `?fields=id,name,status` |
| Searching       | `?q=keyword`             |

Query parameters MUST NOT be used for:

- State-changing operations
- Encoding commands or actions
- Passing unencrypted sensitive data
- Authorization decisions
- Business logic branching

**Forbidden examples:**

- `POST /orders?approve=true`
- `GET /users?accessToken=xxxx`

#### 7.3 Filters

Filter rules:

- Only documented fields can be filtered.
- Unknown filters MUST return `400 Bad Request`.
- Wildcard filtering is not allowed (e.g., free-form ranges). Range filters MUST be explicitly defined using `Min` and `Max` fields.

**Allowed range filter:**

- `?filter=status=ACTIVE&ageMin=18`

**Not allowed range filter:**

- `?filter=status=ACTIVE AND age>18`

The server MUST accept:

- **Repeated parameters (preferred):**  
  `provider=toluna&provider=gmor`
- **Comma-separated values:**  
  `provider=toluna,gmor`

Servers MUST NOT accept Array/JSON-encoded arrays in query strings.

**Forbidden example:**

- `provider=["toluna", "gmor"]`

#### 7.4 Pagination

Two models MAY be used:

- **Offset Pagination**  
  `?page=1&limit=20`

- **Cursor Pagination**  
  `?cursor=abc123&limit=20`

Cursor pagination SHOULD be used for large datasets ONLY.

#### 7.5 Sorting

Example:

- `?sort=createdAt:desc,name:asc`

Sorting:

- Allowed only on indexed fields.
- Fields MUST be validated.
- Default sort MUST be documented.

#### 7.6 Validation & Error Handling

Validation rules:

- Invalid parameter → **400 Bad Request**
- Unsupported parameter → **400 Bad Request**
- Invalid value → **422 Unprocessable Entity** (optional)

### 8. Request Headers

#### 8.1 Requirements

- Headers MUST be compared case-insensitively per RFC 7231.
- Header naming MUST use hyphenated form.

**Example headers:**

- `Authorization: Bearer <token>`
- `Request-Id: <uuid>`
- `Device-Id: <identifier>`

#### 8.2 Authorization

Only the following forms are permitted:

- `Authorization: Bearer <token>`
- `API-Key: <api-key>`

Usage:

- **Authorization**: Authorize specific user for accessing backend resources.
- **API-Key**: Server-to-server integration ONLY (e.g., partner integrations).

Servers MUST reject any other authorization scheme.

### 9. Request Body

The request body defines what data the client sends to change or create server state. It must be:

- Explicit
- Validatable
- Secure
- Backward compatible
- Self-describing

#### 9.1 Rules

Request bodies:

- MUST be JSON unless file upload is required.
- MUST use `camelCase` for all fields; other conventions are not allowed.
- MUST avoid nesting deeper than two levels.
- MUST be strictly validated; invalid bodies MUST return **400 Bad Request**.
- MUST specify a supported `Content-Type` header.
- MUST use UTF-8 as character encoding.
- Field order MUST NOT matter.
- Missing optional fields MUST NOT change behavior.
- Default values MUST be server-defined.

#### 9.2 Media Type & Encoding

Supported media types:

- `application/json` (default)
- `multipart/form-data` (file upload only)

XML is NOT supported unless explicitly approved.

#### 9.3 Validation

All request bodies must be validated for:

- Type
- Length
- Range
- Format
- Enum membership

Any validation failure MUST:

- Return **400 Bad Request**
- Provide field-level error details

#### 9.4 Nullable

Nullable fields:

- `null` MUST have explicit meaning.
- `null` ≠ field omission.

**Example:**

```json
{
  "description": null
}
```

Meaning: explicitly clear the `description` field, not ignore it.

### 10. Idempotency

Idempotency ensures that repeated identical requests produce the same result, which is critical for:

- Network retries
- Client timeouts
- At-least-once delivery
- Distributed systems reliability

An operation is idempotent if executing it multiple times with the same input produces the same server state and response.

#### 10.1 Client Handler

Clients MUST send:

- `Idempotency-Key: <uuid>`

Rules:

- Must be unique per logical operation.
- Must be opaque to the server.
- Must not contain PII.
- Keep the same `Idempotency-Key` if the operation fails (non-2xx). Perform retry from client side using the same key.

#### 10.2 Server Handler

The server MUST:

- Store `idempotency key + request fingerprint` in a stateful collection.
- Detect duplicates.
- Return the same response for repeated keys.

For server-to-server connections, keep the `Idempotency-Key` the same if the operation fails and retry using the same key.

The request fingerprint MUST include:

- HTTP method
- Endpoint
- Request body hash
- Auth context (tenant/user)

If fingerprint differs for the same key:

- Return **409 Conflict**

**Sample conflict response:**

```json
{
  "traceId": "uuid",
  "metadata": null,
  "error": {
    "code": "IDEMPOTENCY_KEY_CONFLICT",
    "message": "Idempotency key reuse with different request payload",
    "errors": []
  },
  "result": null
}
```

### 11. Error Handling Specification

Reference: Microsoft REST API Guidelines – Error Contract.

#### 11.1 Error Response Structure

All error responses MUST conform to the following schema:

```json
{
  "traceId": "uuid",
  "metadata": {
    "...": "pagination or response-level metadata"
  },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "errors": [
      {
        "field": "fieldName",
        "message": "Description of validation issue"
      }
    ]
  },
  "result": null
}
```

#### 11.2 Standard Error Codes

| Code                     | Description                    |
| ------------------------ | ------------------------------ |
| INVALID_BODY             | Request body validation failed |
| INVALID_QUERY            | Query parameter invalid        |
| UNAUTHORIZED             | Token invalid or missing       |
| FORBIDDEN                | Forbidden operation            |
| RESOURCE_NOT_FOUND       | Resource not found             |
| RATE_LIMIT_EXCEEDED      | Too many requests              |
| INTERNAL_SERVER_ERROR    | Unexpected server error        |
| IDEMPOTENCY_KEY_CONFLICT | Conflict on idempotency key    |

### 12. API Versioning

Versioning MUST be implemented via URI prefix:

- `/v1/users`
- `/v2/users`

Rules:

- Breaking changes MUST produce a new version.
- Non-breaking additive changes MAY occur within a version.
- Version MUST NOT be embedded in query parameters or headers.

### 13. Caching Requirements

Caching is used to:

- Reduce latency
- Lower infrastructure cost
- Increase system scalability
- Improve resilience under load

Caching MUST never compromise correctness or security.

#### 13.1 Cache Scope & Layers

Caching may occur at:

- Client / Browser
- CDN / Edge
- API Gateway
- Application Cache
- Database / Query Cache

Each API MUST explicitly define which layers are allowed.

**Cache Eligibility by HTTP Method**

| Method | Cacheable | Notes                        |
| ------ | --------- | ---------------------------- |
| GET    | Yes       | Default cacheable            |
| HEAD   | Yes       | Same as GET                  |
| POST   | No        | Except explicitly documented |
| PUT    | No        | Invalidate cache             |
| PATCH  | No        | Invalidate cache             |
| DELETE | No        | Invalidate cache             |

Reference: RFC 7234 (HTTP Caching)

**Cache-Control Header Standard (Mandatory)**

- **public** → cacheable by shared caches (CDN)
- **private** → user-specific data

Examples:

- `Cache-Control: public, max-age=300`
- `Cache-Control: private, no-store`

Cacheable responses MUST include:

- `Cache-Control: public, max-age=60`

Sensitive endpoints MUST include:

- `Cache-Control: no-store`

Default rules:

- Public read-only data → cacheable
- Authenticated or personalized data → `private`, `no-store`
- Sensitive data → `no-store`

#### 13.2 Cache Invalidation

Cache MUST be invalidated on:

- `PUT`
- `PATCH`
- `DELETE`
- Successful `POST` that creates related data

### 14. Rate Limiting Requirements

Servers MUST return the following headers:

- `RateLimit-Limit: <integer>`
- `RateLimit-Remaining: <integer>`
- `RateLimit-Reset: <epoch-seconds>`

Clients MUST adhere to these headers to avoid throttling.

### 15. OpenAPI Specification Requirements

All APIs MUST be defined using **OpenAPI 3.1**.

PRs modifying API behaviors MUST update the OpenAPI specification.

OpenAPI definitions MUST include:

- Request schema
- Response schema
- Error schema
- Examples

Schema validation MUST be part of CI.

Please refer to the central OpenAPI contract document for detailed specification structure and conventions.

### 16. Testing Requirements

| Test Type     | Required | Notes                        |
| ------------- | -------- | ---------------------------- |
| Unit Test     | MUST     | Cover business logic         |
| Integration   | MUST     | Validate DB, cache, brokers  |
| Contract Test | MUST     | Validate OpenAPI correctness |
| Negative Test | MUST     | Validate error paths         |
| Load Test     | SHOULD   | For high-traffic systems     |

### 17. Deprecation and Sunset Policy

- Deprecation MUST be announced at least **90 days** before removal.
- Documentation MUST be updated with deprecation notice.
- Removal MUST NOT occur without explicit communication.
- Deprecated endpoints MUST remain stable until sunset date.
- Deprecation MUST be documented.

### 18. Backward Compatibility Rules

- Adding fields is backward-compatible.
- Removing fields is NOT backward-compatible.
- Changing data types is NOT backward-compatible.
- Changing behavior semantics requires a new version.
- Error schema MUST remain consistent across minor updates.

### 19. Security Requirements

- All communication MUST use HTTPS.
- Sensitive fields MUST NOT appear in error responses.
- Authorization MUST use Bearer tokens (or approved API keys for server-to-server).
- Inputs MUST be validated to protect against injection attacks.
- Services MUST remove or avoid exposing internal identifiers unintentionally.
