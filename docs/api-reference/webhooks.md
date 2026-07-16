---
title: Webhooks API
sidebar_label: Webhooks
description: Configure the single tenant webhook URL, send a test event, review delivery logs, and understand the inbound CPaaS callbacks.
---

# Webhooks API

There are two distinct webhook flows:

- **Tenant webhooks** (outbound, us → you): you configure **one** webhook URL for your tenant and a list of event types. We POST events to that URL and sign each delivery with your webhook secret. See [Webhook integration](../guides/webhook-integration).
- **CPaaS callbacks** (inbound, Africa's Talking → us): the telephony provider posts call and SMS events to Relavoi. You do **not** call these endpoints; they are documented under [CPaaS callbacks (inbound)](#cpaas-callbacks-inbound) so you understand the full picture.

:::info Single webhook URL per tenant
Relavoi stores **one** webhook URL per tenant, not a collection of webhook subscriptions. Registering again overwrites the previous URL, event list, and secret. There are no per-webhook ids and no `409 conflict` on duplicate URLs.
:::

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| POST | `/v1/webhooks` | Set the tenant webhook URL + events |
| GET | `/v1/webhooks` | Get current webhook config + recent deliveries |
| POST | `/v1/webhooks/test` | Enqueue a synthetic `session.created` delivery |
| GET | `/v1/webhooks/logs` | Paginated delivery logs |
| POST | `/v1/webhooks/cpaas/voice` | Inbound CPaaS voice callback (returns XML) |
| POST | `/v1/webhooks/cpaas/sms` | Inbound CPaaS SMS callback |

Tenant endpoints require a Bearer JWT. Errors follow RFC 7807 Problem Details.

## Event types

The events you may subscribe to (the values the backend actually emits):

| Event | Fires when |
|-------|-----------|
| `session.created` | A masking session is created |
| `session.activated` | A session transitions to `ACTIVE` |
| `session.expired` | A session expires (grace period ends or hard timeout) |
| `call.incoming` | An inbound call arrives on a proxy for an active session |
| `call.answered` | A bridged call is answered |
| `call.ended` | A call completes |
| `call.failed` | A call attempt fails |
| `sms.sent` | An outbound (forwarded) SMS is sent |
| `sms.received` | An inbound SMS arrives on a proxy |

---

### POST /v1/webhooks

Set (or replace) the tenant webhook URL and the events to deliver.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | yes | HTTPS endpoint URL |
| events | string[] | yes | One or more event names from the table above (min 1) |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/webhooks \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://client.example.com/hook",
    "events": ["session.created", "call.answered"]
  }'
```

**Response** — `201 Created`

```json
{
  "url": "https://client.example.com/hook",
  "secret": "whsec_YOUR_WEBHOOK_SECRET",
  "events": ["session.created", "call.answered"]
}
```

:::danger
The `secret` (prefix `whsec_`) is the HMAC key used to sign deliveries to your URL. It is returned each time you register; store it and verify the signature on every delivery.
:::

---

### GET /v1/webhooks

Returns the current webhook configuration plus recent delivery attempts.

**Request**

```bash
curl https://api.relavoi.com/v1/webhooks \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "url": "https://client.example.com/hook",
  "events": [],
  "hasSecret": true,
  "recentDeliveries": []
}
```

- `url` — the configured webhook URL, or `null` if none is set.
- `events` — the subscribed event names.
- `hasSecret` — whether a signing secret is configured (the secret itself is never returned here).
- `recentDeliveries` — up to the latest 50 delivery-log entries (same shape as [`/v1/webhooks/logs`](#get-v1webhookslogs)).

---

### POST /v1/webhooks/test

Enqueues a synthetic `session.created` delivery to your configured webhook URL. Useful for verifying your signature-verification implementation. Takes **no request body** — the event type is always `session.created`.

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/webhooks/test \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response** — `202 Accepted`

```json
{
  "enqueued": true,
  "event": {
    "id": "evt_test_3e2b77ae54cdbd9a",
    "type": "session.created",
    "createdAt": "2026-07-15T12:15:35.673Z",
    "data": {
      "sessionId": "sess_test_cfe25d636a9a",
      "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "proxyNumber": "+2348000000000",
      "test": true
    }
  }
}
```

If no webhook URL is configured, this returns `400` with a `no-webhook` problem detail.

---

### GET /v1/webhooks/logs

Paginated delivery logs, newest first. Cursor pagination by delivery timestamp.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| limit | integer | no | Default 50, max 200 |
| after | string (ISO 8601) | no | Cursor — timestamp of the last row from the previous page |

**Request**

```bash
curl "https://api.relavoi.com/v1/webhooks/logs?limit=20" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "9c1f2b3a-4d5e-6f70-8a9b-0c1d2e3f4a5b",
      "event": "call.answered",
      "url": "https://client.example.com/hook",
      "statusCode": 200,
      "success": true,
      "attemptCount": 1,
      "error": null,
      "requestedAt": "2026-07-15T12:33:24.000Z",
      "completedAt": "2026-07-15T12:33:24.142Z"
    }
  ],
  "pagination": {
    "count": 1,
    "after": null
  }
}
```

Delivery-log fields: `event`, `url`, `statusCode`, `success`, `attemptCount`, `requestedAt`, `completedAt` (plus `id` and an `error` message when a delivery failed).

---

## CPaaS callbacks (inbound)

These endpoints are called by the CPaaS provider (Africa's Talking), **not** by tenants. They are listed here so you understand what Relavoi receives on your behalf. In production they are verified via an `X-AfricasTalking-Signature` HMAC header; the signature check is skipped only in the provider sandbox.

### POST /v1/webhooks/cpaas/voice

Africa's Talking posts inbound call events here (form-encoded). Relavoi makes the routing decision and responds with **Africa's Talking voice XML** (`<Say>`, `<Dial>`, `<Reject>`, `<Redirect>`, `<Play>`) telling the provider how to handle the call. For an expired session with `DEAD_LINE` behavior, for example, the response is:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="woman">This number is no longer in service</Say><Hangup/></Response>
```

An active session with recording enabled returns a consent `<Say>`/`<Play>` followed by a `<Dial>` to the other party. If signature verification fails (non-sandbox), the endpoint responds `403` with an empty voice response.

### POST /v1/webhooks/cpaas/sms

Africa's Talking posts inbound SMS here (form-encoded). Relavoi matches the message to an active session and forwards it to the other party. The endpoint returns a small JSON acknowledgement:

```json
{ "ok": true }
```

---

**Errors (tenant endpoints)**

Errors follow RFC 7807 Problem Details (`application/problem+json`):

```json
{
  "type": "https://api.relavoi.com/errors/validation",
  "title": "Bad Request",
  "status": 400,
  "detail": "url: Invalid url"
}
```

| Status | Type slug | When |
|--------|-----------|------|
| 400 | validation | Invalid URL or empty `events` array |
| 400 | no-webhook | `POST /webhooks/test` with no URL configured |
| 401 | unauthorized | Missing or invalid JWT |
| 404 | not-found | Tenant not found |
