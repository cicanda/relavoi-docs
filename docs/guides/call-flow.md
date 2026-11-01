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
  participant Carrier as Telephony Provider
  participant WH as Webhook Handler
  participant CR as Call Router
  participant Redis
  participant Customer as Customer phone

  Agent->>SDK: tap "Call customer"
  SDK->>Dialer: open tel://+2348000000001
  Dialer->>Carrier: PSTN call to proxy
  Carrier->>WH: POST /v1/webhooks/cpaas/voice (HMAC signed)
  WH->>WH: verify signature + dedupe event_id
  WH->>CR: route(proxy, caller)
  CR->>Redis: HGET session:proxy:+2348000000001
  Redis-->>CR: session sess_a1b2c3d4 (state=ACTIVE)
  CR->>CR: caller matches party_a -> forward to party_b
  CR-->>WH: <Dial>+2348087654321</Dial>
  WH-->>Carrier: 200 OK + dial XML
  Carrier->>Customer: ring with caller ID +2348000000001
  Customer-->>Carrier: answer
  Carrier->>WH: call.answered event
  WH->>Redis: SET session.activated_at
```

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
| Network back to carrier | 30 ms | Same-region (Cape Town) |
| **Total p50** | ~85 ms | |
| **Total p99 headroom** | 415 ms | Absorbs GC pauses, retries |

Anything that pushes routing onto PostgreSQL violates the budget. The Call Router is explicitly designed to never hit Postgres on the hot path.

:::tip Observe your own latency
The `routing.latency.ms` metric is surfaced per tenant in [Analytics](../api-reference/analytics). Set an alert at p99 > 400 ms to catch degradation before customers notice.
:::
