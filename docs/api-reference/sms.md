---
title: SMS API
sidebar_label: SMS
description: List SMS messages exchanged within a masking session — inbound and outbound, including direction-blocked attempts.
---

# SMS API

SMS rides on the same session as voice. See [SMS masking](../guides/sms-masking) for the full flow.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/sessions/:id/sms` | List SMS messages exchanged within the session |

:::note Outbound from your backend
A `POST /v1/sessions/:id/sms` endpoint to push messages from your backend through the proxy is on the **Roadmap**. Today, SMS only flows when an end user sends a message to the proxy. The roadmap endpoint will land in a subsequent release and will be documented here when available.
:::

---

### GET /v1/sessions/:id/sms

Auth: Bearer JWT (tenant).

| Path param | Type | Required | Description |
|------------|------|----------|-------------|
| id | string | yes | Session id |

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| direction | string | no | `A_TO_B` or `B_TO_A` |
| limit | integer | no | Default 50, max 200 |
| after | string | no | Cursor |

**Request**

```bash
curl https://api.relavoi.com/v1/sessions/sess_a1b2c3d4/sms \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "data": [
    {
      "id": "sms_44aa11bb",
      "sessionId": "sess_a1b2c3d4",
      "direction": "A_TO_B",
      "status": "DELIVERED",
      "body": "I am 5 minutes away.",
      "segments": 1,
      "createdAt": "2026-05-22T14:38:00Z",
      "deliveredAt": "2026-05-22T14:38:02Z"
    },
    {
      "id": "sms_55bb22cc",
      "sessionId": "sess_a1b2c3d4",
      "direction": "B_TO_A",
      "status": "BLOCKED_DIRECTION",
      "body": "(redacted — blocked by directionMode)",
      "createdAt": "2026-05-22T14:39:00Z"
    }
  ],
  "nextCursor": null
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | Unknown session |
| 401 | unauthorized | Missing JWT |
