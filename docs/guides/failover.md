---
title: High availability & failover
sidebar_label: Failover
description: What Relavoi does when the telephony provider degrades, what your app sees, how to read provider state from the health endpoint, and what to do on your side.
---

# High availability & failover

Relavoi watches the health of the telephony provider that carries your calls
continuously. When it starts failing, we stop allocating new sessions against
it rather than letting your requests queue behind a provider that is not
answering, and we keep probing until it recovers.

The guarantee is that a degraded carrier reaches you as a clear, immediate
error on session creation, and never as a call that rings nowhere.

## Provider states

| State | What it means for your app |
|---|---|
| `CLOSED` | Normal. New sessions are allocated as usual. |
| `OPEN` | The provider is in trouble. New session creation is refused. Sessions you already hold keep working, and calls already bridged are unaffected. |
| `HALF_OPEN` | Recovering. Some new sessions go through while we confirm the provider is healthy; the rest are still refused. |

Two things are deliberately true of `OPEN` and worth designing for.

**It sits on allocation, not on routing.** A session you created before the
provider degraded continues to route calls, and a call already connected is
never torn down. Only new session creation is refused.

**It clears on its own.** You do not need to tell us, and there is nothing to
reset. The state moves back through `HALF_OPEN` to `CLOSED` once the provider
is answering reliably again.

## Reading provider state

`GET /v1/health/cpaas` reports it, unauthenticated:

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
  "timestamp": "2026-11-06T18:28:19.407Z"
}
```

| Field | Meaning |
|---|---|
| `state` | `CLOSED`, `OPEN` or `HALF_OPEN`, as above |
| `openedAt` | When the provider was marked unhealthy. Non-null only while `OPEN`. |
| `lastError` | The most recent failure that caused it, or `null` |

## What to do on your side

**Retry session creation with backoff.** A refusal while the provider is
degraded is not a permanent failure and not a problem with your request.

**Poll `GET /v1/health/cpaas` rather than retrying blindly.** It tells you
whether a retry is worth making yet, and it costs you nothing: no auth, no
rate limit against your tier.

**Do not tear down sessions you already have.** They still work. Ending them
because session creation is failing is the one reaction that turns our outage
into yours.

**Keep a path that does not need us.** For the window where new sessions
cannot be created, the safe fallback is your own: hold the order, retry, or
put the two people in touch through whatever channel you used before Relavoi.
Tell us if that window ever costs you something, because that is the number
that decides what we build next here.
