---
title: Analytics API
sidebar_label: Analytics
description: Query aggregate usage, session and call timeseries, and call success rate for dashboards and SLO monitoring.
---

# Analytics API

Pre-aggregated metrics for tenant dashboards. All endpoints accept a `from` / `to` time window and `granularity` for timeseries.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/analytics/usage` | Aggregated usage for billing alignment |
| GET | `/v1/analytics/sessions-over-time` | Sessions created per bucket |
| GET | `/v1/analytics/call-success-rate` | Answer / completion ratios |
| GET | `/v1/analytics/calls` | Call counts with filters |

---

### GET /v1/analytics/usage

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| from | string (ISO 8601) | yes | Window start (inclusive) |
| to | string (ISO 8601) | yes | Window end (exclusive) |

**Request**

```bash
curl "https://api.relavoi.com/v1/analytics/usage?from=2026-05-01T00:00:00Z&to=2026-06-01T00:00:00Z" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "from": "2026-05-01T00:00:00Z",
  "to": "2026-06-01T00:00:00Z",
  "sessionsCreated": 18432,
  "callsAttempted": 31204,
  "callsAnswered": 28117,
  "callsCompleted": 27410,
  "callMinutes": 64882,
  "smsSent": 4291,
  "smsReceived": 4198,
  "peakConcurrentSessions": 412
}
```

---

### GET /v1/analytics/sessions-over-time

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| from | string (ISO 8601) | yes | Window start |
| to | string (ISO 8601) | yes | Window end |
| granularity | string | no | `hour` (default), `day`, `week` |

**Request**

```bash
curl "https://api.relavoi.com/v1/analytics/sessions-over-time?from=2026-05-22T00:00:00Z&to=2026-05-23T00:00:00Z&granularity=hour" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "granularity": "hour",
  "points": [
    { "t": "2026-05-22T00:00:00Z", "created": 12, "expired": 9 },
    { "t": "2026-05-22T01:00:00Z", "created": 8, "expired": 11 },
    { "t": "2026-05-22T02:00:00Z", "created": 5, "expired": 6 }
  ]
}
```

---

### GET /v1/analytics/call-success-rate

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| from | string (ISO 8601) | yes | Window start |
| to | string (ISO 8601) | yes | Window end |
| granularity | string | no | `hour`, `day` (default) |

**Request**

```bash
curl "https://api.relavoi.com/v1/analytics/call-success-rate?from=2026-05-15T00:00:00Z&to=2026-05-22T00:00:00Z&granularity=day" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "points": [
    {
      "t": "2026-05-15T00:00:00Z",
      "attempted": 4112,
      "answered": 3702,
      "completed": 3608,
      "answerRate": 0.9003,
      "completionRate": 0.8774
    }
  ]
}
```

---

### GET /v1/analytics/calls

Auth: Bearer JWT (tenant).

Aggregated call counts grouped by status or direction.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| from | string (ISO 8601) | yes | Window start |
| to | string (ISO 8601) | yes | Window end |
| groupBy | string | no | `status` (default) or `direction` |

**Request**

```bash
curl "https://api.relavoi.com/v1/analytics/calls?from=2026-05-22T00:00:00Z&to=2026-05-23T00:00:00Z&groupBy=status" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "groupBy": "status",
  "buckets": {
    "COMPLETED": 1842,
    "ANSWERED": 47,
    "MISSED": 211,
    "FAILED": 18
  }
}
```

**Errors (all endpoints)**

| Status | Code | When |
|--------|------|------|
| 400 | validation | `from` after `to`, or window greater than 90 days |
| 401 | unauthorized | Missing JWT |
| 429 | rate-limit | Tier analytics quota exceeded |
