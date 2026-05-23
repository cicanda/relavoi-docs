---
title: Rate limits
sidebar_label: Rate limits
description: Per-tier request and concurrent-session ceilings, the 429 response contract, and the sliding-window algorithm we use.
---

# Rate limits

Relavoi enforces two ceilings per tenant:

1. **Requests per minute** — sliding window over all API calls
2. **Concurrent sessions** — sessions in `PENDING`, `ACTIVE`, or `GRACE_PERIOD`

## Tier matrix

| Tier | Requests / minute | Concurrent sessions |
|------|-------------------|---------------------|
| STARTER | 100 | 100 |
| GROWTH | 500 | 1,000 |
| ENTERPRISE | 2,000 | 10,000 |

Hitting either ceiling returns a `429 Too Many Requests`.

## 429 response shape

```json
{
  "type": "https://api.relavoi.com/errors/rate-limit",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Tier GROWTH allows 500 requests/minute. Try again in 12 seconds."
}
```

With headers:

```text
Retry-After: 12
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1747920712
X-RateLimit-Policy: sliding-window-60s
```

### Header semantics

| Header | Meaning |
|--------|---------|
| `Retry-After` | Seconds until you may safely retry. Honour this — backoff respects the algorithm |
| `X-RateLimit-Limit` | Your tier's quota for the window |
| `X-RateLimit-Remaining` | Requests left in the current window |
| `X-RateLimit-Reset` | Unix epoch seconds when the oldest request in the window ages out |

## Algorithm

The window is a sliding 60-second window implemented as a **Redis sorted set** keyed `tenant:{tenantId}:rate`. Each API request inserts a member at score `now()`. On every request we:

1. `ZREMRANGEBYSCORE` to evict timestamps older than `now() - 60s`
2. `ZCARD` to count remaining members
3. If count is less than the tier limit, `ZADD` the new timestamp and proceed
4. Otherwise return 429 with `Retry-After` calculated from the oldest member's score

The same approach gives us microsecond precision for `X-RateLimit-Reset` without locks.

## Concurrent session ceiling

This is a separate counter (`tenant:{tenantId}:active_sessions`) atomically incremented at session create and decremented at session expiry. If you exceed it, `POST /v1/sessions` returns 429 with detail `"Tier GROWTH allows 1000 concurrent sessions"`.

## Best practices

- Implement exponential backoff with jitter starting from `Retry-After`
- Use the SDK — it handles 429 transparently with backoff
- Spread session creation across the minute rather than bursting at the top of every minute (cron jobs are a common culprit)
- If you regularly hit the ceiling, upgrade tier or request a temporary lift via your account manager

:::tip Pre-flight check
Use `X-RateLimit-Remaining` from your previous response to decide whether to fire another request. Treat anything below 10% of your limit as a yellow light.
:::
