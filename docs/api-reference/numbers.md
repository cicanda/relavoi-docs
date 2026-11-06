---
title: Numbers API
sidebar_label: Numbers
description: See the proxy numbers your workspace is using, and ask to hold more at once.
---

# Numbers API

Your workspace does not own proxy numbers. It holds them while it is using
them, from a pool Relavoi provisions and manages, and gives them back when its
sessions end. These endpoints show what it is holding and how to ask to hold
more.

## How many numbers you need

A proxy number can carry many sessions at the same time, as long as no
participant appears on it twice. So the number of numbers your workspace needs
is the most sessions any one rider or customer is in at the same moment, not
your volume.

That is worth reading twice, because it is unintuitive and it is the whole
model:

- A delivery company whose riders each handle one order at a time needs
  **one number**, however many thousands of deliveries a day it runs. Every
  live session sits on the same number, and every call routes correctly,
  because each pair of people on it is distinct.
- A rider who picks up a second order before closing the first is in two live
  sessions at once. Those two cannot share a number, because the rider would be
  on it twice and an inbound call from them would be ambiguous. That workspace
  needs **two**.

So the right question is not "how busy are we" but "how often is one of our
people in two live conversations at once". Ask for more numbers when that
number goes up.

Your plan sets how many you may hold at once. Starter holds one; higher plans
hold a few. More than that is reviewed and approved, because a number is bought
from the carrier and loaded by hand.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/numbers/pool` | The numbers you are holding, and your limit |
| GET | `/v1/numbers/requests` | Your requests to hold more |
| POST | `/v1/numbers/provision` | Ask to hold more |
| POST | `/v1/numbers/requests/{id}/withdraw` | Take back an open request |

---

### GET /v1/numbers/pool

Auth: Bearer JWT (tenant or dashboard). Takes no query parameters.

**Request**

```bash
curl https://api.relavoi.com/v1/numbers/pool \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "held": 1,
  "limit": 1,
  "numbers": ["+2349000000100"],
  "explanation": "A proxy number can carry many sessions at the same time, as long as no participant appears on it twice...",
  "pendingRequest": null
}
```

| Field | Description |
|-------|-------------|
| held | Distinct numbers your workspace is holding right now |
| limit | How many it may hold at once, from your plan or your contract |
| numbers | The numbers themselves, in E.164 |
| explanation | Why the limit is the size it is, in one sentence |
| pendingRequest | Your open request to hold more, or `null` |

:::info[This used to be the shared pool]
Until November 2026 this endpoint returned the pool's `total`, `available`,
`inUse` and `cooldown` per region. Those figures described Relavoi's capacity
and other workspaces' activity, not yours: "available: 40" never meant 40 were
available to you, and the figure moved whenever anyone else started a call. It
now answers the question you were really asking.
:::

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | unauthorized | Missing JWT |

---

### GET /v1/numbers/requests

Auth: Bearer JWT. Your own requests, newest first, decided and undecided.

```json
{
  "requests": [
    {
      "id": "b4f1c0de-0000-4000-8000-000000000001",
      "status": "APPROVED",
      "requestedTotal": 3,
      "quotaAtRequest": 1,
      "region": "lagos",
      "note": "Riders double up at lunch.",
      "createdAt": "2026-11-04T09:12:00.000Z",
      "grantedTotal": 2,
      "decidedAt": "2026-11-04T14:40:00.000Z",
      "decisionNote": "Two more bought and loaded."
    }
  ]
}
```

---

### POST /v1/numbers/provision

Auth: Bearer **dashboard** JWT with the `OWNER` role (from
`/auth/dashboard/login`). An SDK token is refused with `403`.

Records a request for a person to decide. Provisioning is manual: a number is
bought from the carrier, whitelisted and loaded into the pool by hand, so no
API call can do it. We email you when it is decided, and an approval raises
your limit with nothing to change on your side.

One open request at a time. Withdraw the open one to ask for a different
figure.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| region | string | yes | Pool region label, e.g. `lagos` |
| requestedTotal | integer | yes | The total you want to hold **at once**, not how many more |
| note | string | no | Why. Say which of your people are in two live sessions at once: that is what decides it |

`count` is accepted as the former name for `requestedTotal` and read the same
way.

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/numbers/provision \
  -H "Authorization: Bearer $RELAVOI_DASHBOARD_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "region": "lagos", "requestedTotal": 3, "note": "Riders take a second order before closing the first." }'
```

**Response:** `201 Created`, with the request.

```json
{
  "id": "b4f1c0de-0000-4000-8000-000000000001",
  "status": "PENDING",
  "requestedTotal": 3,
  "quotaAtRequest": 1,
  "region": "lagos",
  "note": "Riders take a second order before closing the first.",
  "createdAt": "2026-11-04T09:12:00.000Z",
  "grantedTotal": null,
  "decidedAt": null,
  "decisionNote": null
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Missing or invalid `region`, or no total given |
| 403 | forbidden | Called with an SDK token instead of an `OWNER` dashboard token |
| 409 | request-pending | You already have an open request |
| 422 | request-not-an-increase | The figure asked for is not more than your current limit |

---

### POST `/v1/numbers/requests/{id}/withdraw`

Auth: Bearer dashboard JWT with the `OWNER` role. Works only while the request
is still open.

**Errors**

| Status | Code | When |
|--------|------|------|
| 404 | not-found | No open request with that id for your workspace |
| 403 | forbidden | Not an `OWNER` dashboard token |

---

## When you run out

Two different failures on `POST /v1/sessions`, which need different things from
you:

| | What it means | What to do |
|---|---|---|
| `409 number-quota-reached` | You hold every number your plan allows, and each is already in a session with one of these two people | Wait for a session to end, or ask to hold more. Do not retry on a timer: there is no `Retry-After`, and it clears on a state change rather than after an interval |
| `503 pool-exhausted` | No number is free anywhere in the pool, for anybody | Retry with backoff. This is our capacity, and it alerts us |

See [Errors](./errors.md) for both.
