---
title: Core concepts
sidebar_label: Concepts
description: Sessions, proxy numbers, direction modes, grace periods, and consent — the five primitives every Relavoi integrator needs to internalise.
---

# Core concepts

This page is the conceptual ground floor. Every other doc — guides, API, SDKs — assumes you understand these primitives.

## Sessions

A **session** is a time-bounded, two-party link between a real `partyA` (typically your agent) and a real `partyB` (typically your customer) via a shared proxy MSISDN. Sessions are stateful and progress through a finite state machine.

### State machine

```text
                +-----------+
                |  PENDING  |  <-- created, no call yet
                +-----------+
                  |     ^
   first call OK  |     | retry after FAILED
                  v     |
                +-----------+
                |  ACTIVE   |  <-- at least one call landed
                +-----------+
                  |     |
       end()      |     | hard timeout (max_duration_min)
                  v     v
              +----------------+
              | GRACE_PERIOD   |  <-- callbacks still routed
              +----------------+
                       |
                       v
                +-----------+
                |  EXPIRED  |  <-- terminal, number released
                +-----------+
```

A failed creation (number pool exhausted, CPaaS error) transitions `PENDING` to `FAILED`. You can retry, which returns to `PENDING`.

| State | Routes inbound calls? | Notes |
|-------|----------------------|-------|
| PENDING | yes | First successful call promotes to ACTIVE |
| ACTIVE | yes | Normal operating state |
| GRACE_PERIOD | yes | Tail period for late callbacks after `end()` |
| EXPIRED | no | Terminal. Proxy returned to pool after cooldown |
| FAILED | no | Provisioning failure. Retry to recreate |

## Proxy numbers

A proxy number is a real Nigerian MSISDN provisioned through our CPaaS pool. Proxy numbers are a finite resource, and the Number Pool Manager allocates them under three invariants:

1. **Pool sharing**. A single proxy may host multiple concurrent sessions as long as no participant overlaps between sessions on that proxy.
2. **Participant non-overlap**. If session S1 on proxy P contains phones `+2348012345678` and `+2348087654321`, no other session on P may include either of those phones. This is enforced atomically via a Redis Lua script.
3. **Cooldown**. After a session expires, the proxy number enters a 5-minute cooldown (configurable). During cooldown it cannot be reallocated, reducing the chance of a customer calling back and reaching a stranger.

## Direction modes

`directionMode` controls which party can initiate calls on the proxy:

| Value | Agent can call customer | Customer can call agent |
|-------|-------------------------|-------------------------|
| BIDIRECTIONAL | yes | yes |
| A_TO_B_ONLY | yes | no (rejected with tenant's expired-call behavior) |
| B_TO_A_ONLY | no | yes |

`BIDIRECTIONAL` is the default for ride-hailing and delivery. `A_TO_B_ONLY` is common for outbound healthcare callbacks where you do not want the patient to reach the clinician directly later.

## Grace period vs hard timeout

Two independent timers govern session lifetime:

- `gracePeriodMinutes` (default 15) — runs **after** you call `end()`. Allows late callbacks to land on the same proxy. Once this elapses, the session moves to `EXPIRED`.
- `maxDurationMinutes` (default 120) — runs **from creation**. A hard cap on total session lifetime regardless of activity. When this expires, the session jumps straight from `ACTIVE` to `EXPIRED`, skipping `GRACE_PERIOD`.

Pick `gracePeriodMinutes` based on your customer-callback window. Pick `maxDurationMinutes` based on your worst-case order fulfilment time.

## Recording and consent invariant

Call recording is opt-in per session via `recordingEnabled`. The companion field `consentPrompt` selects which audio plays before the call bridges:

| consentPrompt | Behavior |
|---------------|----------|
| DEFAULT | Plays the built-in NDPR statement: "This call may be recorded for quality and safety purposes." |
| CUSTOM | Plays your tenant-configured audio URL |
| NONE | No prompt. **Only valid when `recordingEnabled = false`** |

:::warning Hard invariant
The API rejects any session with `recordingEnabled: true` and `consentPrompt: "NONE"` with a `422` and error type `https://api.relavoi.com/errors/validation`. This is enforced for NDPR compliance and cannot be overridden.
:::

Read [Call recording](../guides/call-recording) for the full NDPR primer and the [Sessions API reference](../api-reference/sessions) for the request schema.
