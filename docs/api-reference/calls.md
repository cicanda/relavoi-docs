---
title: Calls API
sidebar_label: Calls
description: List call records globally with filters, or scoped to a single session, with full duration, status, and recording metadata.
---

# Calls API

Each masked call produces a `call_records` row. Use these endpoints to audit traffic, drive billing checks, and surface call history in your dashboards.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/calls` | List calls across all sessions with filters |
| GET | `/v1/sessions/:id/calls` | List calls scoped to one session |

---

### GET /v1/calls

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | no | Filter by status. Comma list of `RINGING`, `ANSWERED`, `COMPLETED`, `MISSED`, `FAILED` |
| direction | string | no | `A_TO_B` or `B_TO_A` |
| startedAfter | string (ISO 8601) | no | Inclusive lower bound on `initiatedAt` |
| startedBefore | string (ISO 8601) | no | Exclusive upper bound |
| sessionId | string | no | Restrict to one session |
| limit | integer | no | Default 50, max 200 |
| after | string | no | Cursor from previous page |

**Request**

```bash
curl "https://api.relavoi.com/v1/calls?status=COMPLETED&startedAfter=2026-05-22T00:00:00Z&limit=20" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "call_88ee2af1",
      "sessionId": "sess_a1b2c3d4",
      "cpaasCallId": "ATCall_abc123",
      "cpaasProvider": "AFRICASTALKING",
      "direction": "A_TO_B",
      "status": "COMPLETED",
      "durationSeconds": 142,
      "recordingUrl": null,
      "recordingConsentPlayed": false,
      "initiatedAt": "2026-05-22T14:31:00Z",
      "answeredAt": "2026-05-22T14:31:02Z",
      "endedAt": "2026-05-22T14:33:24Z"
    }
  ],
  "nextCursor": null
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Bad filter values |
| 401 | unauthorized | Missing JWT |

---

### GET /v1/sessions/:id/calls

Auth: Bearer JWT (tenant).

| Path param | Type | Required | Description |
|------------|------|----------|-------------|
| id | string | yes | Session id |

**Request**

```bash
curl https://api.relavoi.com/v1/sessions/sess_a1b2c3d4/calls \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "call_88ee2af1",
      "direction": "A_TO_B",
      "status": "COMPLETED",
      "durationSeconds": 142,
      "recordingUrl": "https://recordings.relavoi.com/sess_a1b2c3d4/call_88ee2af1.mp3?sig=...",
      "recordingConsentPlayed": true,
      "initiatedAt": "2026-05-22T14:31:00Z",
      "answeredAt": "2026-05-22T14:31:02Z",
      "endedAt": "2026-05-22T14:33:24Z"
    },
    {
      "id": "call_99ff3bc2",
      "direction": "B_TO_A",
      "status": "MISSED",
      "durationSeconds": 0,
      "initiatedAt": "2026-05-22T14:42:18Z"
    }
  ]
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | Unknown session |
