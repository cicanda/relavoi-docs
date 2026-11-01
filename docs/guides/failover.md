---
title: High availability & failover
sidebar_label: Failover
description: The circuit breaker that watches the telephony provider, what each state means, and how to read it from the health endpoint.
---

# High availability & failover

Relavoi routes Nigerian voice over one licensed telephony provider. A circuit
breaker watches it: repeated call-setup failures trip the breaker, which stops
new sessions being allocated against a provider that is not answering, and
probes it until it recovers.

:::info There is one provider today
A second provider to fail over **to** does not exist yet. No numbers are
provisioned on a backup carrier, so while the breaker is `OPEN` new session
creation is refused rather than rerouted. The breaker is still worth having:
it turns a slow, half-broken provider into a clear error instead of a queue of
calls that never connect, and it is what the recovery probing hangs off.

A secondary pool is on the roadmap. Until it exists, read `OPEN` as "the
carrier is in trouble", not as "we have moved your traffic".
:::

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
| `OPEN` | New session creation is refused; existing sessions continue until natural expiry, and calls in flight are unaffected |
| `HALF_OPEN` | A small share of new sessions probe the provider; the rest are still refused |

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

## What your app sees while the breaker is open

`POST /v1/sessions` fails. Calls already bridged are unaffected, and existing
sessions keep working until they expire, because the breaker sits on allocation
rather than on routing. Retry session creation with backoff; `GET
/v1/health/cpaas` tells you whether it is worth retrying yet.
