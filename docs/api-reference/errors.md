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
| `pool-exhausted` | 503 | Number Pool Manager cannot satisfy participant-overlap rule with any available DID |
| `tier-session-limit` | 429 | Tenant's concurrent-session ceiling reached on `POST /v1/sessions` |
| `number-not-supported` | 422 | A phone number is not one Relavoi can connect. See [Supported numbers](#supported-numbers) |
| `cross-border-not-supported` | 422 | Both numbers are valid, but they are in different countries |
| `country-not-enabled` | 422 | The country is not enabled for your workspace |
| `feature-not-available` | 422 | The feature is not available yet. See [Call recording](#call-recording) |
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

### 422 feature-not-available

Returned when you ask for something the platform is not offering yet. Today
that is call recording, on `POST /v1/sessions` and on `PATCH /v1/config`.

```json
{
  "type": "https://api.relavoi.com/errors/feature-not-available",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Call recording is not available yet."
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

### 503 pool-exhausted

```json
{
  "type": "https://api.relavoi.com/errors/pool-exhausted",
  "title": "Service Unavailable",
  "status": 503,
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

## Supported numbers

Relavoi currently connects **Nigerian mobile numbers only**: `+234` followed by
10 digits starting 7, 8 or 9. That covers the 70x, 80x, 81x, 90x and 91x
ranges.

Any of these forms is accepted and normalised to E.164 for you, so you do not
have to reformat before calling:

| You send | Stored as |
|---|---|
| `+2348012345678` | `+2348012345678` |
| `2348012345678` | `+2348012345678` |
| `08012345678` | `+2348012345678` |
| `8012345678` | `+2348012345678` |
| `0801 234 5678` | `+2348012345678` |

Anything else is a `422`:

```json
{
  "type": "https://api.relavoi.com/errors/number-not-supported",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Relavoi currently connects Nigerian mobile numbers only."
}
```

This applies to `agentPhone` and `customerPhone` on session create, the new
target on retarget, `userPhone` on verification and device registration.

**The error never contains the number you sent.** It reaches logs and error
trackers, so there is nothing to redact.

### Not accepted as a session party

- **Numbers outside Nigeria.** A `+44`, `+1` or `+233` number is refused.
- **Nigerian landlines.** A landline cannot receive a masked call. It is
  accepted for `supportPhone` in `PATCH /v1/config`, because the expired-call
  redirect often points at a business line that is not a mobile.

### One country per session

Both people in a session must have numbers from the same country, and the
proxy number comes from that country's pool. A mixed pair is refused with
`cross-border-not-supported`, and that stays true as further countries are
added: international calling is a separate product, not a wider version of
this one.

```json
{
  "type": "https://api.relavoi.com/errors/cross-border-not-supported",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Both people in a session must have numbers from the same country."
}
```

Nigeria is the country supported today.

## Call recording

Call recording is not available yet. `recordingEnabled: true` is refused with
`feature-not-available` on both `POST /v1/sessions` and `PATCH /v1/config`, and
no call is recorded or stored anywhere.

`recordingEnabled: false`, and leaving the field out, both work as before.

When recording does arrive, a call will only be recorded after a consent
message that the person on the call hears first. That is a requirement of
Nigeria's data protection law, not a setting, so there will be no way to record
without it.
