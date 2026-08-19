---
title: High availability & failover
sidebar_label: Failover
description: How Relavoi keeps voice and SMS flowing during upstream telephony incidents using an automatic circuit-breaker failover between primary and backup providers.
---

# High availability & failover

Relavoi routes Nigerian voice and SMS over a primary telephony provider, with an automatic failover to a backup provider. The handoff between them is automated via a circuit breaker, so traffic keeps flowing during an upstream incident without any action on your side.

## Circuit breaker states

```text
       failures exceed threshold
CLOSED ---------------------------> OPEN
   ^                                  |
   | 95% success over 5 min           | health checks pass 5x in a row
   |                                  v
   +---------------------------- HALF_OPEN
        any failure during probe
```

| State | Routing behavior |
|-------|------------------|
| `CLOSED` | All new sessions allocated on the primary provider |
| `OPEN` | All new sessions allocated on the failover provider; existing sessions continue until natural expiry |
| `HALF_OPEN` | A small share of new sessions probe the primary provider; the rest stay on the failover |

## Trip thresholds

The breaker trips from `CLOSED` to `OPEN` when **either** condition is met:

1. 5 consecutive call-setup failures, **or**
2. Greater than 10% error rate over a sliding 2-minute window

A health check runs every 30 seconds while in `OPEN`. After 5 consecutive successful health checks, the breaker moves to `HALF_OPEN`.

In `HALF_OPEN`, if the probe traffic maintains greater than 95% success over 5 minutes, the breaker closes. Any failure during the probe sends it back to `OPEN`.

## Observing breaker state

The current state is exposed at `GET /v1/health/cpaas`:

```json
{
  "providers": [
    {
      "name": "primary",
      "state": "CLOSED",
      "openedAt": null,
      "lastError": null
    }
  ],
  "timestamp": "2026-07-15T12:15:35.907Z"
}
```

Each provider entry reports its circuit breaker `state` (`CLOSED`, `OPEN`, or `HALF_OPEN`), the `openedAt` timestamp (non-null only while the breaker is `OPEN`), and the `lastError` that most recently tripped it.

## What the SDK does during failover

Nothing visible. Sessions created in `OPEN` state are allocated a failover proxy number transparently. The SDK and your app see the same session object shape. Calls in flight complete normally until their session expires.
