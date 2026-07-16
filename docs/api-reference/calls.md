---
title: Calls API
sidebar_label: Calls
description: List call records globally with filters, fetch a single call, or list calls scoped to a session, with full duration, status, and recording metadata.
---

# Calls API

Each masked call produces a `call_records` row. Use these endpoints to audit traffic, drive billing checks, and surface call history in your dashboards.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/calls` | List calls across all sessions with filters |
| GET | `/v1/calls/:id` | Fetch a single call record |
| GET | `/v1/sessions/:id/calls` | List calls scoped to one session |

---

### GET /v1/calls

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | no | Single status: `RINGING`, `ANSWERED`, `COMPLETED`, `MISSED`, or `FAILED` |
| direction | string | no | `A_TO_B` or `B_TO_A` |
| periodStart | string (ISO 8601) | no | Inclusive lower bound on `initiatedAt` |
| periodEnd | string (ISO 8601) | no | Exclusive upper bound on `initiatedAt` |
| sessionId | string | no | Restrict to one session |
| limit | integer | no | Default 50, max 200 |
| after | string | no | Cursor from the previous page's `pagination.after` |

**Request**

```bash
curl "https://api.relavoi.com/v1/calls?status=COMPLETED&periodStart=2026-07-01T00:00:00Z&limit=20" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "call_88ee2af1",
      "sessionId": "5661962a-d7ad-4aea-88a0-210388e1285b",
      "status": "COMPLETED",
      "direction": "A_TO_B",
      "durationSeconds": 142,
      "initiatedAt": "2026-07-15T12:31:00.000Z",
      "answeredAt": "2026-07-15T12:31:02.000Z",
      "endedAt": "2026-07-15T12:33:24.000Z",
      "cpaasCallId": "ATCall_abc123",
      "cpaasProvider": "AFRICASTALKING",
      "recordingUrl": null
    }
  ],
  "pagination": {
    "count": 1,
    "after": null
  }
}
```

`pagination.after` is a cursor (the id of the last row). It is `null` when there are no more pages.

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Bad filter values |
| 401 | unauthorized | Missing JWT |

---

### GET /v1/calls/:id

Auth: Bearer JWT (tenant).

Fetch a single call record. The call must belong to a session owned by your tenant.

| Path param | Type | Required | Description |
|------------|------|----------|-------------|
| id | string | yes | Call record UUID |

**Request**

```bash
curl https://api.relavoi.com/v1/calls/call_88ee2af1 \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "id": "call_88ee2af1",
  "sessionId": "5661962a-d7ad-4aea-88a0-210388e1285b",
  "status": "COMPLETED",
  "direction": "A_TO_B",
  "durationSeconds": 142,
  "initiatedAt": "2026-07-15T12:31:00.000Z",
  "answeredAt": "2026-07-15T12:31:02.000Z",
  "endedAt": "2026-07-15T12:33:24.000Z",
  "cpaasCallId": "ATCall_abc123",
  "cpaasProvider": "AFRICASTALKING",
  "recordingUrl": null
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | No call with that id under this tenant |

The 404 body follows RFC 7807:

```json
{
  "type": "https://api.relavoi.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Call not found."
}
```

---

### GET /v1/sessions/:id/calls

Auth: Bearer JWT (tenant).

List the call records belonging to a single session. This session-scoped variant additionally includes `recordingConsentPlayed`.

| Path param | Type | Required | Description |
|------------|------|----------|-------------|
| id | string | yes | Session id |

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| limit | integer | no | Default 50, max 200 |
| after | string | no | Cursor from the previous page's `pagination.after` |

**Request**

```bash
curl https://api.relavoi.com/v1/sessions/5661962a-d7ad-4aea-88a0-210388e1285b/calls \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "call_88ee2af1",
      "sessionId": "5661962a-d7ad-4aea-88a0-210388e1285b",
      "status": "COMPLETED",
      "direction": "A_TO_B",
      "durationSeconds": 142,
      "cpaasCallId": "ATCall_abc123",
      "cpaasProvider": "AFRICASTALKING",
      "recordingUrl": "https://recordings.relavoi.com/.../call_88ee2af1.mp3?sig=...",
      "recordingConsentPlayed": true,
      "initiatedAt": "2026-07-15T12:31:00.000Z",
      "answeredAt": "2026-07-15T12:31:02.000Z",
      "endedAt": "2026-07-15T12:33:24.000Z"
    }
  ],
  "pagination": {
    "count": 1,
    "after": null
  }
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | Unknown session |
