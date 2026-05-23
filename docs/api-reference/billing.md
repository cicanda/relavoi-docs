---
title: Billing API
sidebar_label: Billing
description: Fetch current-period usage, itemised billing events, and the public pricing schedule for your tier.
---

# Billing API

Billing data is computed nightly from the same Analytics Engine that powers dashboards. Numbers in the billing endpoints are authoritative for invoicing.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/billing/usage` | Current-period usage summary |
| GET | `/v1/billing/events` | Itemised billable events |
| GET | `/v1/billing/pricing` | Per-tier pricing schedule |

---

### GET /v1/billing/usage

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| period | string | no | `current` (default) or `YYYY-MM` |

**Request**

```bash
curl "https://api.relavoi.com/v1/billing/usage?period=current" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tier": "GROWTH",
  "period": "2026-05",
  "periodStart": "2026-05-01T00:00:00Z",
  "periodEnd": "2026-06-01T00:00:00Z",
  "lineItems": [
    { "label": "Base subscription", "units": 1, "unitPrice": 49000, "currency": "NGN", "amount": 49000 },
    { "label": "Voice minutes", "units": 64882, "unitPrice": 12, "currency": "NGN", "amount": 778584 },
    { "label": "SMS segments", "units": 8489, "unitPrice": 4, "currency": "NGN", "amount": 33956 },
    { "label": "Proxy DIDs", "units": 250, "unitPrice": 200, "currency": "NGN", "amount": 50000 }
  ],
  "subtotal": 911540,
  "tax": 68366,
  "total": 979906,
  "currency": "NGN"
}
```

---

### GET /v1/billing/events

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| from | string (ISO 8601) | yes | Window start |
| to | string (ISO 8601) | yes | Window end |
| type | string | no | `voice`, `sms`, `did`, `subscription` |
| limit | integer | no | Default 100, max 500 |
| after | string | no | Cursor |

**Request**

```bash
curl "https://api.relavoi.com/v1/billing/events?from=2026-05-20T00:00:00Z&to=2026-05-22T00:00:00Z&type=voice" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "be_88aa11",
      "type": "voice",
      "sessionId": "sess_a1b2c3d4",
      "callId": "call_88ee2af1",
      "units": 2.37,
      "unit": "minutes",
      "unitPrice": 12,
      "amount": 29,
      "currency": "NGN",
      "occurredAt": "2026-05-22T14:33:24Z"
    }
  ],
  "nextCursor": "YmVfODhhYTEy"
}
```

---

### GET /v1/billing/pricing

Auth: none — public endpoint.

**Request**

```bash
curl https://api.relavoi.com/v1/billing/pricing
```

**Response**

```json
{
  "currency": "NGN",
  "tiers": [
    {
      "tier": "STARTER",
      "basePrice": 19000,
      "concurrentSessions": 100,
      "requestsPerMinute": 100,
      "voicePerMinute": 14,
      "smsPerSegment": 5,
      "didPerMonth": 250
    },
    {
      "tier": "GROWTH",
      "basePrice": 49000,
      "concurrentSessions": 1000,
      "requestsPerMinute": 500,
      "voicePerMinute": 12,
      "smsPerSegment": 4,
      "didPerMonth": 200
    },
    {
      "tier": "ENTERPRISE",
      "basePrice": null,
      "concurrentSessions": 10000,
      "requestsPerMinute": 2000,
      "voicePerMinute": "custom",
      "smsPerSegment": "custom",
      "didPerMonth": "custom"
    }
  ]
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Bad date range or period |
| 401 | unauthorized | Missing JWT (usage / events only) |
