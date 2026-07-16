---
title: Sessions API
sidebar_label: Sessions
description: Create, list, fetch, update, end, and verify masking sessions — the core primitive of the Relavoi platform.
---

# Sessions API

A session binds two real phone numbers to a proxy MSISDN for a bounded period. See [Concepts](../getting-started/concepts) for the state machine.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| POST | `/v1/sessions` | Create a masking session |
| GET | `/v1/sessions` | List sessions with filters |
| GET | `/v1/sessions/:id` | Get one session |
| PATCH | `/v1/sessions/:id` | Update metadata / extend grace period |
| POST | `/v1/sessions/:id/end` | End a session (enters GRACE_PERIOD) |
| GET | `/v1/sessions/verify` | SDK call-verification lookup |
| GET | `/v1/sessions/:id/calls` | List call records for one session |
| GET | `/v1/sessions/:id/sms` | List SMS records for one session |

---

### POST /v1/sessions

Auth: Bearer JWT (tenant).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agentPhone | string | yes | E.164, e.g. `+2348012345678` |
| customerPhone | string | yes | E.164 |
| metadata | object | no | Free-form key/value context |
| gracePeriodMinutes | integer | no | Default 15 |
| directionMode | string | no | `BIDIRECTIONAL` (default), `A_TO_B_ONLY`, `B_TO_A_ONLY` |
| maxDurationMinutes | integer | no | Hard timeout, default 120 |
| recordingEnabled | boolean | no | Default false |
| consentPrompt | string | no | `DEFAULT`, `CUSTOM`, `NONE`. Must not be `NONE` if recording is enabled |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/sessions \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "agentPhone": "+2348012345678",
    "customerPhone": "+2348087654321",
    "directionMode": "BIDIRECTIONAL",
    "gracePeriodMinutes": 15,
    "recordingEnabled": false,
    "metadata": { "orderId": "DOC-1" }
  }'
```

**Response** — `201 Created`. The session becomes `ACTIVE` immediately and a proxy number is allocated.

```json
{
  "id": "5661962a-d7ad-4aea-88a0-210388e1285b",
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "proxyNumber": "+2348000000009",
  "state": "ACTIVE",
  "directionMode": "BIDIRECTIONAL",
  "metadata": { "orderId": "DOC-1" },
  "gracePeriodMinutes": 15,
  "maxDurationMinutes": 120,
  "recordingEnabled": false,
  "consentPrompt": "NONE",
  "expiresAt": "2026-07-15T14:14:59.758Z",
  "createdAt": "2026-07-15T12:14:59.758Z",
  "activatedAt": "2026-07-15T12:14:59.758Z",
  "endedAt": null,
  "expiredAt": null,
  "callCount": 0,
  "lastCallAt": null
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Bad E.164, invalid enum, or invalid recording/consent combination |
| 429 | tier-session-limit | Tier concurrent-session quota exceeded |
| 503 | pool-exhausted | No proxy number satisfies the participant-overlap rule |

---

### GET /v1/sessions

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| state | string | no | Filter by a single state: `PENDING`, `ACTIVE`, `GRACE_PERIOD`, `EXPIRED`, or `FAILED` |
| limit | integer | no | Default 20, max 100 |
| after | string | no | Cursor from the previous page's `pagination.after` (a timestamp) |

**Request**

```bash
curl "https://api.relavoi.com/v1/sessions?state=ACTIVE&limit=20" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "5661962a-d7ad-4aea-88a0-210388e1285b",
      "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "proxyNumber": "+2348000000009",
      "state": "ACTIVE",
      "directionMode": "BIDIRECTIONAL",
      "metadata": { "orderId": "DOC-1" },
      "gracePeriodMinutes": 15,
      "maxDurationMinutes": 120,
      "recordingEnabled": false,
      "consentPrompt": "NONE",
      "expiresAt": "2026-07-15T14:14:59.758Z",
      "createdAt": "2026-07-15T12:14:59.758Z",
      "activatedAt": "2026-07-15T12:14:59.758Z",
      "endedAt": null,
      "expiredAt": null,
      "callCount": 0,
      "lastCallAt": null
    }
  ],
  "pagination": {
    "count": 1,
    "after": "2026-07-13T14:56:45.562Z"
  }
}
```

`pagination.after` is a timestamp cursor. When there are no more pages it is `null`. Pass it back as the `after` query parameter to fetch the next page.

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Out-of-range limit or invalid state |
| 401 | unauthorized | Missing or expired JWT |

---

### GET /v1/sessions/:id

Auth: Bearer JWT (tenant).

| Path param | Type | Required | Description |
|------------|------|----------|-------------|
| id | string | yes | Session UUID |

**Request**

```bash
curl https://api.relavoi.com/v1/sessions/5661962a-d7ad-4aea-88a0-210388e1285b \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "id": "5661962a-d7ad-4aea-88a0-210388e1285b",
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "proxyNumber": "+2348000000009",
  "state": "ACTIVE",
  "directionMode": "BIDIRECTIONAL",
  "metadata": { "orderId": "DOC-1" },
  "gracePeriodMinutes": 15,
  "maxDurationMinutes": 120,
  "recordingEnabled": false,
  "consentPrompt": "NONE",
  "expiresAt": "2026-07-15T14:14:59.758Z",
  "createdAt": "2026-07-15T12:14:59.758Z",
  "activatedAt": "2026-07-15T12:14:59.758Z",
  "endedAt": null,
  "expiredAt": null,
  "callCount": 0,
  "lastCallAt": null
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | No session with that id under this tenant |

---

### PATCH /v1/sessions/:id

Auth: Bearer JWT (tenant).

Update a session in place. You can merge new keys into `metadata` and/or adjust the grace period. When the session is already in `GRACE_PERIOD`, changing `gracePeriodMinutes` also extends `expiresAt`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| metadata | object | no | Merged (shallow) into existing metadata |
| gracePeriodMinutes | integer | no | New grace period; extends `expiresAt` if in `GRACE_PERIOD` |

Unknown fields are rejected with a `400 validation` error.

**Request**

```bash
curl -X PATCH https://api.relavoi.com/v1/sessions/5661962a-d7ad-4aea-88a0-210388e1285b \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "metadata": { "note": "x" } }'
```

**Response** — the full, updated session. Note `metadata` is merged, not replaced.

```json
{
  "id": "5661962a-d7ad-4aea-88a0-210388e1285b",
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "proxyNumber": "+2348000000009",
  "state": "ACTIVE",
  "directionMode": "BIDIRECTIONAL",
  "metadata": { "note": "x", "orderId": "DOC-1" },
  "gracePeriodMinutes": 15,
  "maxDurationMinutes": 120,
  "recordingEnabled": false,
  "consentPrompt": "NONE",
  "expiresAt": "2026-07-15T14:14:59.758Z",
  "createdAt": "2026-07-15T12:14:59.758Z",
  "activatedAt": "2026-07-15T12:14:59.758Z",
  "endedAt": null,
  "expiredAt": null,
  "callCount": 0,
  "lastCallAt": null
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Unknown field or bad value |
| 404 | not-found | Unknown session |

---

### POST /v1/sessions/:id/end

Auth: Bearer JWT (tenant).

Transitions the session to `GRACE_PERIOD` and resets `expiresAt` to `now + gracePeriodMinutes`. After the grace period, state moves to `EXPIRED`.

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/sessions/5661962a-d7ad-4aea-88a0-210388e1285b/end \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response** — the full session, now in `GRACE_PERIOD`.

```json
{
  "id": "5661962a-d7ad-4aea-88a0-210388e1285b",
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "proxyNumber": "+2348000000009",
  "state": "GRACE_PERIOD",
  "directionMode": "BIDIRECTIONAL",
  "metadata": { "note": "x", "orderId": "DOC-1" },
  "gracePeriodMinutes": 15,
  "maxDurationMinutes": 120,
  "recordingEnabled": false,
  "consentPrompt": "NONE",
  "expiresAt": "2026-07-15T12:29:59.959Z",
  "createdAt": "2026-07-15T12:14:59.758Z",
  "activatedAt": "2026-07-15T12:14:59.758Z",
  "endedAt": "2026-07-15T12:14:59.959Z",
  "expiredAt": null,
  "callCount": 0,
  "lastCallAt": null
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | session-end-failed | Session already EXPIRED or FAILED |
| 404 | not-found | Unknown session |

---

### GET /v1/sessions/verify

Auth: Bearer JWT (tenant). Called by the SDK to drive the call-verification banner; not typically called by your backend directly.

The tenant is derived from the JWT. Pass the user's **raw E.164 phone number** as `userPhone` — the backend hashes it internally with the per-tenant salt to look up an active session.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| userPhone | string | yes | The user's phone in raw E.164, e.g. `+2348012340001` |

**Request**

```bash
curl "https://api.relavoi.com/v1/sessions/verify?userPhone=+2348012340001" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response — verified**

```json
{
  "verified": true,
  "sessionId": "5661962a-d7ad-4aea-88a0-210388e1285b",
  "proxyNumber": "+2348000000009",
  "metadata": { "orderId": "DOC-1" }
}
```

**Response — not verified**

```json
{
  "verified": false
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Missing or non-E.164 `userPhone` |
| 401 | unauthorized | Missing JWT |

---

### GET /v1/sessions/:id/calls

Auth: Bearer JWT (tenant).

List the call records belonging to a single session. Returns the standard pagination envelope. See [Calls API](./calls) for the shape of each call record.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| limit | integer | no | Default 50, max 200 |
| after | string | no | Cursor from the previous page's `pagination.after` |

**Request**

```bash
curl https://api.relavoi.com/v1/sessions/5661962a-d7ad-4aea-88a0-210388e1285b/calls \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [],
  "pagination": {
    "count": 0,
    "after": null
  }
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | Unknown session |

---

### GET /v1/sessions/:id/sms

Auth: Bearer JWT (tenant).

List the SMS records belonging to a single session. Same pagination envelope as the calls endpoint.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| limit | integer | no | Default 50, max 200 |
| after | string | no | Cursor from the previous page's `pagination.after` |

**Request**

```bash
curl https://api.relavoi.com/v1/sessions/5661962a-d7ad-4aea-88a0-210388e1285b/sms \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [],
  "pagination": {
    "count": 0,
    "after": null
  }
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | Unknown session |
