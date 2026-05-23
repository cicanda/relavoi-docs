---
title: Webhooks API
sidebar_label: Webhooks
description: Register and manage tenant webhook URLs, replay logs, and handle the CPaaS-facing webhook endpoint that returns dial XML.
---

# Webhooks API

Two distinct webhook flows:

- **Tenant webhooks** (outbound from us to you): you register your URL and we POST events to it. Documented in [Webhook integration](../guides/webhook-integration).
- **CPaaS webhook** (inbound from Africa's Talking to us): listed below for completeness; you typically do not call this yourself.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| POST | `/v1/webhooks` | Register a tenant webhook URL |
| GET | `/v1/webhooks` | List registered tenant webhooks |
| POST | `/v1/webhooks/test` | Send a test payload to your webhook |
| GET | `/v1/webhooks/logs` | Review delivery attempts (incl. DLQ) |
| POST | `/v1/webhooks/cpaas/voice` | CPaaS-facing inbound handler (HMAC-signed) |

---

### POST /v1/webhooks

Auth: Bearer JWT (tenant).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | yes | HTTPS endpoint, max 500 chars |
| events | string[] | yes | Event types to deliver, or `["*"]` |
| description | string | no | Free-form label |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/webhooks \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.yourcompany.com/relavoi/webhooks",
    "events": ["session.*", "call.*"],
    "description": "Primary production endpoint"
  }'
```

**Response**

```json
{
  "id": "wh_77bb22cc",
  "url": "https://api.yourcompany.com/relavoi/webhooks",
  "events": ["session.*", "call.*"],
  "secret": "whsec_YOUR_WEBHOOK_SECRET",
  "createdAt": "2026-05-22T14:30:00Z"
}
```

:::danger
The `secret` is returned once. Store it immediately — it is the HMAC key for signature verification.
:::

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Non-HTTPS URL or unknown event type |
| 409 | conflict | Webhook with same URL already registered |

---

### GET /v1/webhooks

Auth: Bearer JWT (tenant).

**Request**

```bash
curl https://api.relavoi.com/v1/webhooks \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "wh_77bb22cc",
      "url": "https://api.yourcompany.com/relavoi/webhooks",
      "events": ["session.*", "call.*"],
      "createdAt": "2026-05-22T14:30:00Z",
      "lastDeliveryAt": "2026-05-22T14:33:24Z",
      "lastDeliveryStatus": 200
    }
  ]
}
```

---

### POST /v1/webhooks/test

Auth: Bearer JWT (tenant).

Sends a synthetic event to a registered webhook. Useful for verifying signature implementation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| webhookId | string | yes | Target webhook id |
| eventType | string | no | Default `session.created` |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/webhooks/test \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "webhookId": "wh_77bb22cc", "eventType": "call.answered" }'
```

**Response**

```json
{
  "deliveryId": "whd_99cc33dd",
  "status": 200,
  "latencyMs": 142,
  "deliveredAt": "2026-05-22T14:30:01Z"
}
```

---

### GET /v1/webhooks/logs

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| webhookId | string | no | Filter to one webhook |
| status | string | no | `delivered`, `failed`, `dlq` |
| from | string (ISO 8601) | no | Window start |
| to | string (ISO 8601) | no | Window end |
| limit | integer | no | Default 50, max 200 |

**Request**

```bash
curl "https://api.relavoi.com/v1/webhooks/logs?status=failed&limit=20" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "whd_99cc33dd",
      "webhookId": "wh_77bb22cc",
      "eventId": "evt_22aa11bb",
      "eventType": "call.failed",
      "attempt": 3,
      "responseStatus": 502,
      "responseBody": "<html>Bad Gateway</html>",
      "nextRetryAt": "2026-05-22T14:42:00Z",
      "status": "RETRYING"
    }
  ]
}
```

---

### POST /v1/webhooks/cpaas/voice

Auth: HMAC signature (CPaaS-only). Your code does not call this endpoint.

The CPaaS provider posts call events here. The response is **XML** containing CPaaS voice actions (`<Dial>`, `<Say>`, `<Play>`, `<Record>`).

**Headers**

- `X-CPaaS-Signature` — HMAC-SHA256 of body, signed with the CPaaS-shared secret
- `X-CPaaS-Provider` — `africastalking` or `twilio`

**Sample inbound payload**

```json
{
  "sessionId": "ATCall_abc123",
  "callerNumber": "+2348012345678",
  "destinationNumber": "+2348000000001",
  "direction": "Inbound",
  "eventId": "evt_22aa11bb"
}
```

**Sample response**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman">This call may be recorded for quality and safety purposes.</Say>
  <Dial record="true" callerId="+2348000000001">+2348087654321</Dial>
</Response>
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | unauthorized | HMAC verification failed |
| 422 | validation | Payload missing required fields |
| 500 | internal | Routing error (Webhook Handler will return safe-fail XML) |
