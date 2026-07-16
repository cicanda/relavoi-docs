---
title: SMS API
sidebar_label: SMS
description: List SMS message records exchanged within a masking session. SMS masking flows automatically through the existing session — there is no send-SMS API.
---

# SMS API

SMS masking rides on an existing masking session. There is **no send-SMS API endpoint** — you do not push messages through Relavoi with an API call. Instead, when an end user texts a proxy number, Africa's Talking delivers it to `POST /v1/webhooks/cpaas/sms`, Relavoi matches it to the active session, and forwards it to the other party from the same proxy. Replies follow the same path in reverse.

The only tenant-facing SMS endpoint lists the **records** of those exchanges. See [SMS masking](../guides/sms-masking) for the full flow.

:::note Privacy
SMS records never contain the message body or content. Relavoi stores only routing and delivery metadata (direction, status, provider ids, timestamps). Message text is forwarded but not retained.
:::

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/sessions/:id/sms` | List SMS records exchanged within the session |

---

### GET /v1/sessions/:id/sms

Auth: Bearer JWT (tenant). Returns SMS records for the session, newest first, with cursor pagination.

| Path param | Type | Required | Description |
|------------|------|----------|-------------|
| id | string | yes | Session id |

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| limit | integer | no | Default 50, max 200 |
| after | string | no | Cursor — `sentAt` timestamp of the last row from the previous page |

**Request**

```bash
curl "https://api.relavoi.com/v1/sessions/5661962a-d7ad-4aea-88a0-210388e1285b/sms" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response (empty session)**

```json
{
  "data": [],
  "pagination": {
    "count": 0,
    "after": null
  }
}
```

**Response (with records)**

```json
{
  "data": [
    {
      "id": "9c1f2b3a-4d5e-6f70-8a9b-0c1d2e3f4a5b",
      "sessionId": "5661962a-d7ad-4aea-88a0-210388e1285b",
      "direction": "A_TO_B",
      "status": "DELIVERED",
      "cpaasMessageId": "ATXid_9f2b1c",
      "cpaasProvider": "AFRICASTALKING",
      "sentAt": "2026-07-15T12:38:00.000Z",
      "deliveredAt": "2026-07-15T12:38:02.000Z"
    }
  ],
  "pagination": {
    "count": 1,
    "after": null
  }
}
```

Note the absence of any `body` / message-content field — see the privacy note above.

---

**Errors**

Errors follow RFC 7807 Problem Details (`application/problem+json`):

```json
{
  "type": "https://api.relavoi.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Session not found."
}
```

| Status | Type slug | When |
|--------|-----------|------|
| 400 | validation | Invalid `limit` / `after` |
| 401 | unauthorized | Missing or invalid JWT |
| 404 | not-found | Unknown session (or not owned by tenant) |
