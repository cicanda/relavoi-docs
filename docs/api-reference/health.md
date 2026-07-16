---
title: Health API
sidebar_label: Health
description: Unauthenticated liveness and CPaaS circuit-breaker status endpoints for monitoring and uptime checks.
---

# Health API

These endpoints report platform health. They require **no authentication** and are safe to poll from load balancers, uptime monitors, and status pages.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/health` | Liveness and dependency checks |
| GET | `/v1/health/cpaas` | CPaaS provider circuit-breaker state |

---

### GET /v1/health

Reports overall service health plus the status of core dependencies (PostgreSQL, Redis).

**Request**

```bash
curl https://api.relavoi.com/v1/health
```

**Response**

```json
{
  "status": "healthy",
  "checks": {
    "postgres": "ok",
    "redis": "ok"
  },
  "timestamp": "2026-07-15T12:15:35.885Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| status | string | Overall status, e.g. `healthy` |
| checks.postgres | string | PostgreSQL check result (`ok`) |
| checks.redis | string | Redis check result (`ok`) |
| timestamp | string | ISO-8601 time the check ran |

---

### GET /v1/health/cpaas

Reports the circuit-breaker state for each CPaaS provider. Use this to observe failover between Africa's Talking (primary) and Twilio (failover).

**Request**

```bash
curl https://api.relavoi.com/v1/health/cpaas
```

**Response**

```json
{
  "providers": [
    {
      "name": "africastalking",
      "state": "CLOSED",
      "openedAt": null,
      "lastError": null
    }
  ],
  "timestamp": "2026-07-15T12:15:35.907Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| providers[].name | string | Provider identifier, e.g. `africastalking` |
| providers[].state | string | Circuit-breaker state: `CLOSED`, `OPEN`, or `HALF_OPEN` |
| providers[].openedAt | string \| null | When the breaker last opened, or `null` if closed |
| providers[].lastError | string \| null | Last recorded error, or `null` |
| timestamp | string | ISO-8601 time the check ran |
