---
title: Analytics API
sidebar_label: Analytics
description: Query aggregate usage, session and call timeseries, and call success rate for dashboards and SLO monitoring.
---

# Analytics API

Pre-aggregated metrics for tenant dashboards. Every endpoint takes a `periodStart` / `periodEnd` window (ISO 8601, with offset). Timeseries endpoints also accept a `granularity` bucket.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/analytics/usage` | Aggregated usage for billing alignment |
| GET | `/v1/analytics/sessions-over-time` | Sessions created per bucket |
| GET | `/v1/analytics/call-success-rate` | Answer / completion ratios per bucket |
| GET | `/v1/analytics/calls` | Call totals with status / direction breakdown |

All endpoints require a Bearer JWT (tenant). Errors follow RFC 7807 Problem Details.

---

### GET /v1/analytics/usage

Aggregated billable-event counts for the window.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| periodStart | string (ISO 8601) | yes | Window start (inclusive) |
| periodEnd | string (ISO 8601) | yes | Window end (exclusive) |

**Request**

```bash
curl "https://api.relavoi.com/v1/analytics/usage?periodStart=2026-07-01T00:00:00Z&periodEnd=2026-07-31T00:00:00Z" \
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

### GET /v1/analytics/sessions-over-time

Count of sessions created per time bucket. Returns a **bare array** (no envelope).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| periodStart | string (ISO 8601) | yes | Window start |
| periodEnd | string (ISO 8601) | yes | Window end |
| granularity | string | no | `hour` or `day` (default `day`) |

**Request**

```bash
curl "https://api.relavoi.com/v1/analytics/sessions-over-time?periodStart=2026-07-13T00:00:00Z&periodEnd=2026-07-16T00:00:00Z&granularity=day" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
[
  { "ts": "2026-07-13T00:00:00.000Z", "count": 2 },
  { "ts": "2026-07-15T00:00:00.000Z", "count": 1 }
]
```

---

### GET /v1/analytics/call-success-rate

Per-bucket call outcome counts and a computed success `rate` (answered + completed over total, rounded to 4 dp). Returns a **bare array** (empty when there are no calls in the window).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| periodStart | string (ISO 8601) | yes | Window start |
| periodEnd | string (ISO 8601) | yes | Window end |
| granularity | string | no | `hour` or `day` (default `day`) |

**Request**

```bash
curl "https://api.relavoi.com/v1/analytics/call-success-rate?periodStart=2026-07-01T00:00:00Z&periodEnd=2026-07-31T00:00:00Z&granularity=day" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
[
  {
    "ts": "2026-07-15T00:00:00.000Z",
    "total": 120,
    "answered": 12,
    "completed": 96,
    "missed": 9,
    "failed": 3,
    "rate": 0.9
  }
]
```

---

### GET /v1/analytics/calls

Total calls in the window, average duration, and breakdowns by status and by direction. The window can optionally be narrowed with `status` and `direction` filters.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| periodStart | string (ISO 8601) | yes | Window start |
| periodEnd | string (ISO 8601) | yes | Window end |
| status | string | no | Filter: `RINGING`, `ANSWERED`, `COMPLETED`, `MISSED`, `FAILED` |
| direction | string | no | Filter: `A_TO_B` or `B_TO_A` |

**Request**

```bash
curl "https://api.relavoi.com/v1/analytics/calls?periodStart=2026-07-01T00:00:00Z&periodEnd=2026-07-31T00:00:00Z" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "periodStart": "2026-07-01T00:00:00Z",
  "periodEnd": "2026-07-31T00:00:00Z",
  "total": 0,
  "avgDurationSeconds": 0,
  "byStatus": [],
  "byDirection": []
}
```

When calls exist, `byStatus` and `byDirection` contain one row per group:

```json
{
  "periodStart": "2026-07-01T00:00:00Z",
  "periodEnd": "2026-07-31T00:00:00Z",
  "total": 120,
  "avgDurationSeconds": 142,
  "byStatus": [
    { "status": "COMPLETED", "count": 96 },
    { "status": "MISSED", "count": 21 },
    { "status": "FAILED", "count": 3 }
  ],
  "byDirection": [
    { "direction": "A_TO_B", "count": 74 },
    { "direction": "B_TO_A", "count": 46 }
  ]
}
```

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
| 400 | validation | Missing/invalid `periodStart` or `periodEnd` |
| 401 | unauthorized | Missing or invalid JWT |
| 429 | rate-limit | Tier rate limit exceeded |
