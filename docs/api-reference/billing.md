---
title: Billing API
sidebar_label: Billing
description: Fetch period usage, raw billable events, billing periods, and the per-tier pricing schedule.
---

# Billing API

Billing is metered from the same usage events that power analytics. All billing endpoints require a Bearer JWT (tenant) — there is no public billing endpoint. Errors follow RFC 7807 Problem Details.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/billing/usage` | Metered usage totals for a window |
| GET | `/v1/billing/events` | Raw billable usage events |
| GET | `/v1/billing/periods` | List billing periods (paginated) |
| GET | `/v1/billing/pricing` | Per-tier / per-metric pricing schedule |

---

### GET /v1/billing/usage

Same aggregation as `GET /v1/analytics/usage`. Takes a `periodStart` / `periodEnd` window.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| periodStart | string (ISO 8601) | yes | Window start (inclusive) |
| periodEnd | string (ISO 8601) | yes | Window end (exclusive) |

**Request**

```bash
curl "https://api.relavoi.com/v1/billing/usage?periodStart=2026-07-01T00:00:00Z&periodEnd=2026-07-31T00:00:00Z" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "periodStart": "2026-07-01T00:00:00.000Z",
  "periodEnd": "2026-07-31T00:00:00.000Z",
  "metrics": {
    "session_created": 3,
    "call_minute": 0,
    "sms_sent": 0,
    "sms_received": 0,
    "recording_minute": 0,
    "number_rental": 0
  },
  "totalEvents": 3
}
```

---

### GET /v1/billing/events

Raw, itemised usage events for the window. Events are returned in their **raw `snake_case` database shape** under an `events` array (this endpoint is not envelope-paginated; use `limit` / `offset` to page).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| periodStart | string (ISO 8601) | yes | Window start |
| periodEnd | string (ISO 8601) | yes | Window end |
| metric | string | no | Filter to a single metric (e.g. `session_created`) |
| limit | integer | no | Default 100, max 500 |
| offset | integer | no | Default 0 |

**Request**

```bash
curl "https://api.relavoi.com/v1/billing/events?periodStart=2026-07-01T00:00:00Z&periodEnd=2026-07-31T00:00:00Z" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "events": [
    {
      "id": "136477cc-96e8-47ee-ba62-b978a952628d",
      "tenant_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "billing_period_id": "03f72955-0f9d-4560-bbfb-1249806421b4",
      "metric": "session_created",
      "quantity": "1.0000",
      "unit_price": null,
      "recorded_at": "2026-07-15T12:14:59.776Z",
      "session_id": null,
      "call_record_id": null,
      "metadata": {}
    }
  ]
}
```

---

### GET /v1/billing/periods

Lists the tenant's billing periods, newest first. Cursor pagination by period `id`: pass the last row's `id` as `after` to fetch older periods.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| limit | integer | no | Default 12, max 24 |
| after | string (UUID) | no | Cursor — id of the last period from the previous page |

**Request**

```bash
curl "https://api.relavoi.com/v1/billing/periods" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "03f72955-0f9d-4560-bbfb-1249806421b4",
      "periodStart": "2026-07-01T00:00:00.000Z",
      "periodEnd": "2026-08-01T00:00:00.000Z",
      "status": "ACTIVE",
      "createdAt": "2026-07-13T14:45:49.759Z",
      "closedAt": null
    }
  ],
  "pagination": {
    "count": 1,
    "after": null
  }
}
```

---

### GET /v1/billing/pricing

Per-tier, per-metric pricing rows. Requires authentication (Bearer JWT) — this is **not** a public endpoint. Rows are returned as `camelCase` DTOs with numeric price / quantity fields.

**Request**

```bash
curl "https://api.relavoi.com/v1/billing/pricing" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "tiers": [
    {
      "id": "cf0a15f8-c355-4a11-9f3e-70dfee31ab42",
      "tier": "ENTERPRISE",
      "metric": "session_created",
      "unitPrice": 0,
      "includedQuantity": 10000,
      "overagePrice": 1,
      "currency": "NGN",
      "effectiveFrom": "2026-07-11T14:11:33.667Z",
      "effectiveUntil": null
    },
    {
      "id": "82f10e36-44aa-4707-92e0-2db5db28b766",
      "tier": "ENTERPRISE",
      "metric": "number_rental",
      "unitPrice": 400,
      "includedQuantity": 50,
      "overagePrice": 400,
      "currency": "NGN",
      "effectiveFrom": "2026-07-11T12:04:06.278Z",
      "effectiveUntil": "2026-07-11T14:11:33.667Z"
    }
  ]
}
```

Superseded pricing rows carry a non-null `effectiveUntil`; the currently active row for a tier/metric has `effectiveUntil: null`.

---

**Errors (all endpoints)**

Errors follow RFC 7807 Problem Details (`application/problem+json`):

```json
{
  "type": "https://api.relavoi.com/errors/validation",
  "title": "Bad Request",
  "status": 400,
  "detail": "periodStart: Invalid datetime"
}
```

| Status | Type slug | When |
|--------|-----------|------|
| 400 | validation | Missing/invalid query params |
| 401 | unauthorized | Missing or invalid JWT |
| 429 | rate-limit | Tier rate limit exceeded |
