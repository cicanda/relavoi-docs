---
title: Call flow and routing
sidebar_label: Call flow
description: End-to-end sequence of a masked call from agent dial to bridged customer, plus the latency budget that keeps p99 routing under 500 ms.
---

# Call flow and routing

This guide walks the full request path of a masked voice call and shows where each millisecond goes.

## Primary call flow

The agent taps "Call customer" in your app. The SDK already knows the active session and proxy number. From there:

```mermaid
sequenceDiagram
  participant Agent as Agent (Driver app)
  participant SDK as Relavoi SDK
  participant Dialer as Native dialer
  participant AT as Africa's Talking
  participant WH as Webhook Handler
  participant CR as Call Router
  participant Redis
  participant Customer as Customer phone

  Agent->>SDK: tap "Call customer"
  SDK->>Dialer: open tel://+2348000000001
  Dialer->>AT: PSTN call to proxy
  AT->>WH: POST /v1/webhooks/cpaas/voice (HMAC signed)
  WH->>WH: verify signature + dedupe event_id
  WH->>CR: route(proxy, caller)
  CR->>Redis: HGET session:proxy:+2348000000001
  Redis-->>CR: session sess_a1b2c3d4 (state=ACTIVE)
  CR->>CR: caller matches party_a -> forward to party_b
  CR-->>WH: <Dial>+2348087654321</Dial>
  WH-->>AT: 200 OK + dial XML
  AT->>Customer: ring with caller ID +2348000000001
  Customer-->>AT: answer
  AT->>WH: call.answered event
  WH->>Redis: SET session.activated_at
```

## Recording consent flow

When `recordingEnabled = true`, the Call Router prepends a `<Say>` or `<Play>` action before the `<Dial>`. The bridge does not happen until the consent prompt finishes.

```mermaid
sequenceDiagram
  participant AT as Africa's Talking
  participant WH as Webhook Handler
  participant CR as Call Router
  participant Customer as Customer phone

  AT->>WH: POST incoming call
  WH->>CR: route(proxy, caller)
  CR->>CR: recording_enabled=true, consent_prompt=DEFAULT
  CR-->>WH: <Say>This call may be recorded...</Say><Dial>+2348087654321</Dial><Record/>
  WH-->>AT: 200 OK
  AT->>AT: play consent text-to-speech
  AT->>Customer: ring
  Customer-->>AT: answer (recording begins)
```

If `consentPrompt = CUSTOM`, the router emits `<Play>https://cdn.tenant.com/consent.mp3</Play>` instead.

## Latency budget

Our routing SLO is `p99 < 500 ms` from webhook receipt to dial response. The budget breakdown:

| Stage | Budget | Notes |
|-------|--------|-------|
| TLS + HTTP parse | 20 ms | Fastify with HTTP/2 |
| HMAC signature verify | 5 ms | `crypto.timingSafeEqual` |
| Redis dedup lookup | 5 ms | `GET webhook:dedup:{event_id}` |
| Redis session lookup | 10 ms | `HGETALL session:proxy:{number}` |
| Routing decision | 5 ms | Pure CPU, no I/O |
| Response serialization | 10 ms | XML build |
| Network back to CPaaS | 30 ms | Same-region (Cape Town) |
| **Total p50** | ~85 ms | |
| **Total p99 headroom** | 415 ms | Absorbs GC pauses, retries |

Anything that pushes routing onto PostgreSQL violates the budget. The Call Router is explicitly designed to never hit Postgres on the hot path.

:::tip Observe your own latency
The `routing.latency.ms` metric is surfaced per tenant in [Analytics](../api-reference/analytics). Set an alert at p99 > 400 ms to catch degradation before customers notice.
:::
