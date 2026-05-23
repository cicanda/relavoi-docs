---
title: Sessions API
sidebar_label: Sessions
description: Create, list, fetch, end, and verify masking sessions — the core primitive of the Relavoi platform.
---

# Sessions API

A session binds two real phone numbers to a proxy MSISDN for a bounded period. See [Concepts](../getting-started/concepts) for the state machine.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| POST | `/v1/sessions` | Create a masking session |
| GET | `/v1/sessions` | List sessions with filters |
| GET | `/v1/sessions/:id` | Get one session |
| POST | `/v1/sessions/:id/end` | End a session (enters GRACE_PERIOD) |
| GET | `/v1/sessions/verify` | SDK call-verification lookup |

---

### POST /v1/sessions

Auth: Bearer JWT (tenant).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agentPhone | string | yes | E.164, e.g. `+2348012345678` |
| customerPhone | string | yes | E.164 |
| directionMode | string | no | `BIDIRECTIONAL` (default), `A_TO_B_ONLY`, `B_TO_A_ONLY` |
| gracePeriodMinutes | integer | no | 1-60, default 15 |
| maxDurationMinutes | integer | no | 5-1440, default 120 |
| recordingEnabled | boolean | no | Default false |
| consentPrompt | string | no | `DEFAULT`, `CUSTOM`, `NONE`. Must not be `NONE` if recording is enabled |
| metadata | object | no | Free-form key/value, max 16 keys, 2KB total |

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
    "maxDurationMinutes": 120,
    "recordingEnabled": false,
    "metadata": { "orderId": "ORD-9281" }
  }'
```

**Response**

```json
{
  "id": "sess_a1b2c3d4",
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "proxyNumber": "+2348000000001",
  "state": "PENDING",
  "directionMode": "BIDIRECTIONAL",
  "gracePeriodMinutes": 15,
  "maxDurationMinutes": 120,
  "recordingEnabled": false,
  "consentPrompt": "NONE",
  "createdAt": "2026-05-22T14:30:00Z",
  "expiresAt": "2026-05-22T16:30:00Z",
  "metadata": { "orderId": "ORD-9281" }
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Bad E.164, invalid enum, oversized metadata |
| 422 | validation | recordingEnabled true with consentPrompt NONE |
| 409 | pool-exhausted | No proxy number satisfies the participant-overlap rule |
| 429 | rate-limit | Tier session quota exceeded |

---

### GET /v1/sessions

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| state | string | no | Filter by state, comma-separated |
| createdAfter | string (ISO 8601) | no | Inclusive lower bound |
| createdBefore | string (ISO 8601) | no | Exclusive upper bound |
| limit | integer | no | Default 50, max 200 |
| after | string | no | Cursor from previous page |

**Request**

```bash
curl "https://api.relavoi.com/v1/sessions?state=ACTIVE&limit=50" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "sess_a1b2c3d4",
      "proxyNumber": "+2348000000001",
      "state": "ACTIVE",
      "createdAt": "2026-05-22T14:30:00Z",
      "metadata": { "orderId": "ORD-9281" }
    }
  ],
  "nextCursor": "c2Vzc18yYjNjNGQ1ZQ=="
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Bad cursor or out-of-range limit |
| 401 | unauthorized | Missing or expired JWT |

---

### GET /v1/sessions/:id

Auth: Bearer JWT (tenant).

| Path param | Type | Required | Description |
|------------|------|----------|-------------|
| id | string | yes | Session id, e.g. `sess_a1b2c3d4` |

**Request**

```bash
curl https://api.relavoi.com/v1/sessions/sess_a1b2c3d4 \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "id": "sess_a1b2c3d4",
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "proxyNumber": "+2348000000001",
  "state": "ACTIVE",
  "directionMode": "BIDIRECTIONAL",
  "gracePeriodMinutes": 15,
  "maxDurationMinutes": 120,
  "recordingEnabled": false,
  "consentPrompt": "NONE",
  "createdAt": "2026-05-22T14:30:00Z",
  "activatedAt": "2026-05-22T14:31:02Z",
  "expiresAt": "2026-05-22T16:30:00Z",
  "callCount": 2,
  "lastCallAt": "2026-05-22T14:42:18Z",
  "metadata": { "orderId": "ORD-9281" }
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | No session with that id under this tenant |

---

### POST /v1/sessions/:id/end

Auth: Bearer JWT (tenant).

Transitions the session to `GRACE_PERIOD`. After `gracePeriodMinutes`, state moves to `EXPIRED`.

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/sessions/sess_a1b2c3d4/end \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "id": "sess_a1b2c3d4",
  "state": "GRACE_PERIOD",
  "endedAt": "2026-05-22T14:45:11Z",
  "expiresAt": "2026-05-22T15:00:11Z"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | Unknown session |
| 409 | validation | Session already EXPIRED or FAILED |

---

### GET /v1/sessions/verify

Auth: Bearer JWT (tenant). Called by the SDK; not typically called by your backend directly.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| userPhoneHash | string | yes | SHA-256 of the user's phone with tenant salt |
| windowSeconds | integer | no | How recent the call must be, default 60 |

**Request**

```bash
curl "https://api.relavoi.com/v1/sessions/verify?userPhoneHash=4f8b3c...&windowSeconds=60" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response — verified**

```json
{
  "verified": true,
  "sessionId": "sess_a1b2c3d4",
  "proxyNumber": "+2348000000001",
  "context": "Your Chowdeck rider is calling",
  "metadata": { "orderId": "ORD-9281" }
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
| 400 | validation | Missing or malformed hash |
| 401 | unauthorized | Missing JWT |
