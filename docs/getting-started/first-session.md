---
title: Your first masking session
sidebar_label: First session
description: Exchange your API key for a JWT, create a session, simulate an incoming call, and tear it down — all from curl.
---

# Your first masking session

This page walks the full create-call-end loop using `curl`. You will need the credentials from [Sign up](./signup).

## 1. Exchange credentials for a JWT

Every Relavoi API call (except `/v1/auth/*`) requires a Bearer JWT. JWTs expire after 15 minutes; SDKs refresh transparently, but for raw HTTP calls you mint one yourself.

```bash
curl -X POST https://api.relavoi.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk_live_YOUR_API_KEY_HERE",
    "apiSecret": "f3a9c7b1d8e4f5a6b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5"
  }'
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

Stash the token in a shell variable:

```bash
export RELAVOI_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 2. Create a masking session

A session binds two real phone numbers to a single proxy. The agent (`partyA`) and customer (`partyB`) can call each other on the proxy for the lifetime of the session.

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

Response:

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
  "expiresAt": "2026-05-22T16:30:00Z",
  "createdAt": "2026-05-22T14:30:00Z",
  "metadata": { "orderId": "ORD-9281" }
}
```

`proxyNumber` is the only phone number your UI should ever show. Both parties dial it and answer it.

## 3. Simulate an incoming call

In production, real PSTN calls arrive at our webhook handler from Africa's Talking. To test the routing path locally, use the simulator endpoint:

```bash
curl -X POST https://api.relavoi.com/v1/sessions/sess_a1b2c3d4/simulate-call \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+2348012345678",
    "direction": "A_TO_B"
  }'
```

Response:

```json
{
  "callId": "call_88ee2af1",
  "sessionId": "sess_a1b2c3d4",
  "status": "ANSWERED",
  "from": "+2348012345678",
  "to": "+2348087654321",
  "proxyNumber": "+2348000000001",
  "answeredAt": "2026-05-22T14:31:02Z"
}
```

Notice the session also transitions from `PENDING` to `ACTIVE` on first successful call.

## 4. End the session

When the order is delivered, end the session. The session moves into `GRACE_PERIOD` for `gracePeriodMinutes` to handle callbacks, then to `EXPIRED`.

```bash
curl -X POST https://api.relavoi.com/v1/sessions/sess_a1b2c3d4/end \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

Response:

```json
{
  "id": "sess_a1b2c3d4",
  "state": "GRACE_PERIOD",
  "endedAt": "2026-05-22T14:45:11Z",
  "expiresAt": "2026-05-22T15:00:11Z"
}
```

That is the entire lifecycle. Read [Concepts](./concepts) next to understand the state machine, direction modes, and consent invariants in depth.
