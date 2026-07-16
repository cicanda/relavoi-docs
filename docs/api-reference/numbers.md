---
title: Numbers API
sidebar_label: Numbers
description: Inspect your proxy number pool and request additional capacity from the CPaaS provider.
---

# Numbers API

Proxy numbers are managed centrally by Relavoi's Number Pool Manager. These endpoints let you observe pool health and request more capacity.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/numbers/pool` | View pool capacity per region and provider |
| POST | `/v1/numbers/provision` | Request additional numbers (not yet available) |

---

### GET /v1/numbers/pool

Auth: Bearer JWT (tenant).

Returns one entry per region/provider combination. This endpoint takes no query parameters.

**Request**

```bash
curl https://api.relavoi.com/v1/numbers/pool \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "pools": [
    {
      "region": "lagos",
      "provider": "AFRICASTALKING",
      "total": 10,
      "available": 9,
      "inUse": 1,
      "cooldown": 0
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| region | Pool region label |
| provider | `AFRICASTALKING`, `TWILIO`, or `PLIVO` |
| total | Numbers provisioned in this region/provider |
| available | Numbers ready for allocation |
| inUse | Numbers currently bound to an active session |
| cooldown | Numbers in post-session cooldown, temporarily unavailable |

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | unauthorized | Missing JWT |

---

### POST /v1/numbers/provision

Auth: Bearer **dashboard** JWT with `OWNER` role (from `/auth/dashboard/login`). A standard SDK/tenant token is rejected with `403`.

:::warning Not yet available
Self-service provisioning is not yet implemented. Even with a valid owner token the endpoint returns `501`. Requesting additional capacity today is a human-in-the-loop step — contact support. The contract is documented here so integrations can be staged against it.
:::

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| region | string | yes | Pool region label |
| count | integer | yes | Number of DIDs to provision (1-100) |
| provider | string | no | `AFRICASTALKING` (default), `TWILIO`, or `PLIVO` |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/numbers/provision \
  -H "Authorization: Bearer $RELAVOI_DASHBOARD_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "count": 50, "region": "lagos" }'
```

**Response (today)** — `501 Not Implemented`. Note this body is a plain `{ error }` object, not the RFC 7807 shape.

```json
{
  "error": "Number provisioning via API is not yet available. Contact support."
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Missing/invalid `region` or `count` |
| 403 | forbidden | Called with a tenant/SDK token instead of an `OWNER` dashboard token |
| 501 | — | Endpoint not yet implemented (returned for authorized owners) |
