---
title: CPaaS failover
sidebar_label: Failover
description: How Relavoi falls over from Africa's Talking to Twilio using a circuit breaker, the trip thresholds, and the capacity model for the secondary pool.
---

# CPaaS failover

Africa's Talking is the primary CPaaS provider for Nigerian traffic — pricing, PSTN routing, and SMS deliverability are best-in-region. Twilio is the failover. The handoff between them is automated via a circuit breaker.

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
| `CLOSED` | All new sessions allocated on Africa's Talking pool |
| `OPEN` | All new sessions allocated on Twilio pool; existing AT sessions continue until natural expiry |
| `HALF_OPEN` | 10% of new sessions probe Africa's Talking; rest stay on Twilio |

## Trip thresholds

The breaker trips from `CLOSED` to `OPEN` when **either** condition is met:

1. 5 consecutive call-setup failures, **or**
2. Greater than 10% error rate over a sliding 2-minute window

A health check (lightweight Africa's Talking API call) runs every 30 seconds while in `OPEN`. After 5 consecutive successful health checks, the breaker moves to `HALF_OPEN`.

In `HALF_OPEN`, if the probe traffic maintains greater than 95% success over 5 minutes, the breaker closes. Any failure during the probe sends it back to `OPEN`.

## Twilio pool sizing

The Twilio failover pool is provisioned at roughly **20% of primary pool capacity**. Rationale:

- Twilio Nigerian DIDs cost ~5x what AT charges
- Full failover events are rare (target: less than 4 hours per quarter)
- During failover, new session capacity is reduced to ~20%; existing sessions are unaffected

If a failover lasts more than 30 minutes, the Auto-Provisioner kicks in and requests additional Twilio numbers up to your tier's hard ceiling.

## Observing breaker state

The current state is exposed at `GET /v1/health/cpaas`:

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

Each provider entry reports its circuit breaker `state` (`CLOSED`, `OPEN`, or `HALF_OPEN`), the `openedAt` timestamp (non-null only while the breaker is `OPEN`), and the `lastError` that most recently tripped it.

:::tip Capacity planning
If your peak concurrent sessions are 5,000 on AT, you should plan for ~1,000 Twilio DIDs in failover reserve. Confirm capacity with your account manager before scaling beyond ENTERPRISE defaults.
:::

## What the SDK does during failover

Nothing visible. Sessions created in `OPEN` state are allocated a Twilio proxy number transparently. The SDK and your app see the same session object shape. Calls in flight on AT numbers complete normally until their session expires.
