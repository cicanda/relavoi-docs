---
title: Your first masking session
sidebar_label: First session
description: Exchange your API key for a JWT, create a session, inspect it, and tear it down — all from curl.
---

# Your first masking session

This page walks the full create-inspect-end loop using `curl`. You will need the credentials from [Sign up](./signup).

## 1. Exchange credentials for a JWT

Every Relavoi API call (except `/v1/auth/*`) requires a Bearer JWT. SDK tokens expire after 15 minutes; the SDKs refresh transparently, but for raw HTTP calls you mint one yourself with `POST /v1/auth/token`.

```bash
curl -X POST https://api.relavoi.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "rk_live_YOUR_API_KEY_HERE",
    "apiSecret": "rs_YOUR_API_SECRET_HERE"
  }'
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

`expiresIn` is in seconds — 900 seconds is 15 minutes. Stash the token in a shell variable:

```bash
export RELAVOI_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 2. Create a masking session

A session binds two real phone numbers to a single proxy. The agent (`agentPhone`) and customer (`customerPhone`) can reach each other on the proxy for the lifetime of the session. Only `agentPhone` and `customerPhone` are required; the rest are optional and fall back to your tenant defaults.

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
    "metadata": { "orderId": "ORD-9281" }
  }'
```

Response:

```json
{
  "id": "5661962a-d7ad-4aea-88a0-210388e1285b",
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "proxyNumber": "+2348000000009",
  "state": "ACTIVE",
  "directionMode": "BIDIRECTIONAL",
  "metadata": { "orderId": "ORD-9281" },
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

A freshly created session is `ACTIVE` and its proxy is ready to route calls immediately. `proxyNumber` is the only phone number your UI should ever show — both parties dial it and answer it.

Save the session ID for the next steps:

```bash
export RELAVOI_SESSION_ID="5661962a-d7ad-4aea-88a0-210388e1285b"
```

## 3. Inspect the session's calls

In production, real PSTN calls arrive at our webhook handler from Africa's Talking, and each leg is recorded against the session. You can list those call records at any time. A brand-new session has none yet:

```bash
curl -X GET "https://api.relavoi.com/v1/sessions/$RELAVOI_SESSION_ID/calls" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

Response:

```json
{
  "data": [],
  "pagination": {
    "count": 0,
    "after": null
  }
}
```

Every list endpoint uses this shape: a `data` array plus a `pagination` object with a `count` and an `after` cursor. When `after` is non-null, pass it back as a query parameter (`?after=...`) to fetch the next page; a `null` `after` means there are no more results.

## 4. End the session

When the order is delivered, end the session. It moves into `GRACE_PERIOD` for `gracePeriodMinutes` to handle late callbacks, then to `EXPIRED`.

```bash
curl -X POST "https://api.relavoi.com/v1/sessions/$RELAVOI_SESSION_ID/end" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

Response:

```json
{
  "id": "5661962a-d7ad-4aea-88a0-210388e1285b",
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "proxyNumber": "+2348000000009",
  "state": "GRACE_PERIOD",
  "directionMode": "BIDIRECTIONAL",
  "metadata": { "orderId": "ORD-9281" },
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

Notice `expiresAt` has been pulled forward to `endedAt` plus the grace period. That is the entire lifecycle. Read [Concepts](./concepts) next to understand the state machine, direction modes, and consent invariants in depth.
