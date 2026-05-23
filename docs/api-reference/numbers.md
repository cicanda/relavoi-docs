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
| GET | `/v1/numbers/pool` | View pool capacity and utilization |
| POST | `/v1/numbers/provision` | Request additional numbers (Roadmap) |

---

### GET /v1/numbers/pool

Auth: Bearer JWT (tenant).

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| region | string | no | Filter by region, e.g. `NG-LA` (Lagos) |
| provider | string | no | `AFRICASTALKING` or `TWILIO` |

**Request**

```bash
curl "https://api.relavoi.com/v1/numbers/pool?region=NG-LA" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "totals": {
    "provisioned": 250,
    "available": 198,
    "inUse": 48,
    "cooldown": 4,
    "quarantined": 0
  },
  "byProvider": {
    "AFRICASTALKING": { "provisioned": 200, "available": 158 },
    "TWILIO": { "provisioned": 50, "available": 40 }
  },
  "utilization": 0.21,
  "p95Utilization7d": 0.62,
  "recommendedSize": 312
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | unauthorized | Missing JWT |

---

### POST /v1/numbers/provision

Auth: Bearer JWT (tenant) with ADMIN role.

:::warning Roadmap
Self-service provisioning is on the roadmap and currently returns `501 Not Implemented`. Today, requesting additional capacity is a human-in-the-loop step routed to your account manager. The endpoint contract is documented here so integrations can be staged against it.
:::

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| count | integer | yes | Number of DIDs to provision (1-500) |
| region | string | yes | e.g. `NG-LA` |
| provider | string | no | Default `AFRICASTALKING` |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/numbers/provision \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "count": 50, "region": "NG-LA" }'
```

**Response (today)**

```json
{
  "type": "https://api.relavoi.com/errors/not-implemented",
  "title": "Not Implemented",
  "status": 501,
  "detail": "Self-service provisioning is roadmap. Contact your account manager."
}
```

**Future success response**

```json
{
  "requestId": "prov_77aa88bb",
  "status": "PENDING",
  "estimatedCompletion": "2026-05-22T15:30:00Z",
  "count": 50,
  "region": "NG-LA",
  "provider": "AFRICASTALKING"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 403 | forbidden | Not an ADMIN |
| 501 | not-implemented | Endpoint not yet GA |
