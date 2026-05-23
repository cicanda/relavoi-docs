---
title: Errors
sidebar_label: Errors
description: Relavoi returns RFC 7807 Problem Details for every non-2xx response. This page lists every error type the API can emit.
---

# Errors

All Relavoi API errors follow [RFC 7807 (Problem Details for HTTP APIs)](https://datatracker.ietf.org/doc/html/rfc7807). Every error payload is JSON with a stable `type` URL, a human `title`, the HTTP `status`, and a request-specific `detail`.

## Error shape

```json
{
  "type": "https://api.relavoi.com/errors/validation",
  "title": "Bad Request",
  "status": 400,
  "detail": "agentPhone must be E.164 format"
}
```

Optional fields:

- `instance` — a unique error correlation id (`urn:relavoi:err:<uuid>`)
- `errors` — array of field-level issues for validation errors

## Type catalog

Every error `type` resolves to a human-readable description page at `https://api.relavoi.com/errors/<slug>`.

| Slug | HTTP status | When it fires |
|------|-------------|---------------|
| `unauthorized` | 401 | Missing, malformed, or expired JWT; bad API key/secret on `/v1/auth/token` |
| `forbidden` | 403 | Authenticated but lacking the required role or scope (e.g. user JWT calling SDK endpoint) |
| `validation` | 400 / 422 | Field-level validation failure; includes `errors[]` |
| `rate-limit` | 429 | Per-tenant rate limit exceeded; check `Retry-After` header |
| `not-found` | 404 | Resource does not exist or is not visible to your tenant |
| `pool-exhausted` | 409 | Number Pool Manager cannot satisfy participant-overlap rule with any available DID |
| `internal` | 500 | Server-side error; transient — retry with backoff |

## Worked examples

### 401 unauthorized

```json
{
  "type": "https://api.relavoi.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "JWT signature verification failed",
  "instance": "urn:relavoi:err:b8f3a9c7-1d8e-4f5a-b2c3-d4e5f6a7b8c9"
}
```

### 422 validation (recording invariant)

```json
{
  "type": "https://api.relavoi.com/errors/validation",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "consentPrompt cannot be NONE when recordingEnabled is true",
  "errors": [
    { "field": "consentPrompt", "issue": "invalid_combination" }
  ]
}
```

### 429 rate-limit

```json
{
  "type": "https://api.relavoi.com/errors/rate-limit",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Tier GROWTH allows 500 requests/minute. Try again in 12 seconds."
}
```

Accompanied by:

```text
Retry-After: 12
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1747920712
```

### 409 pool-exhausted

```json
{
  "type": "https://api.relavoi.com/errors/pool-exhausted",
  "title": "Conflict",
  "status": 409,
  "detail": "No proxy number available satisfies the participant non-overlap rule. Try again or request more DIDs."
}
```

### 500 internal

```json
{
  "type": "https://api.relavoi.com/errors/internal",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred. The Relavoi engineering team has been notified.",
  "instance": "urn:relavoi:err:f8a2b1c4-3d4e-5f6a-7b8c-9d0e1f2a3b4c"
}
```

:::tip Correlation
Whenever you open a support ticket, include the `instance` value from the error payload. It maps directly to a trace span in our observability stack.
:::
