---
title: Webhook integration
sidebar_label: Webhooks
description: Register your endpoint, verify HMAC-SHA256 signatures with timestamp, handle retries, and react to every session and call event.
---

# Webhook integration

Relavoi pushes session and call events to your webhook URL within seconds of the underlying telephony event. This guide covers registration, event types, signature verification in three languages, and the retry contract.

## 1. Register your endpoint

In the dashboard go to **Settings -> Webhooks** and set:

- **URL**: `https://api.yourcompany.com/relavoi/webhooks`
- **Secret**: auto-generated 32-byte hex string (you can rotate)

Alternatively, use the API:

```bash
curl -X POST https://api.relavoi.com/v1/webhooks \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.yourcompany.com/relavoi/webhooks",
    "events": ["*"]
  }'
```

The response includes the signing secret. Store it somewhere safe — you need it for verification.

## 2. Event types

| Event | When it fires |
|-------|--------------|
| `session.created` | Session inserted in PENDING |
| `session.activated` | First call bridges, state becomes ACTIVE |
| `session.expired` | State transitions to EXPIRED (either via grace expiry or hard timeout) |
| `call.incoming` | Inbound call arrives on the proxy, before bridge |
| `call.answered` | Customer or agent picks up |
| `call.ended` | Either party hangs up |
| `call.failed` | Call routing failed (busy, no answer, network) |
| `sms.received` | Inbound SMS arrives on the proxy |
| `sms.sent` | Outbound SMS leaves on the proxy |

Every payload includes `id`, `type`, `tenantId`, `sessionId`, `occurredAt`, and a `data` object specific to the event.

## 3. Signature headers

Every request carries two headers:

```text
X-Relavoi-Timestamp: 1747920662
X-Relavoi-Signature: t=1747920662,v1=8e2d3a...c4f9
```

The signing string is the timestamp, a literal `.`, and the raw request body:

```text
${timestamp}.${rawBody}
```

The signature is the hex HMAC-SHA256 of the signing string using your webhook secret as the key.

:::warning Reject stale timestamps
Always reject requests where `|now - timestamp| > 300 seconds`. This prevents replay attacks if a signed payload leaks.
:::

## 4. Verification examples

### Node.js

```typescript
import crypto from 'node:crypto';
import express from 'express';

const app = express();
const SECRET = process.env.RELAVOI_WEBHOOK_SECRET!;

app.post(
  '/relavoi/webhooks',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sigHeader = req.header('X-Relavoi-Signature') ?? '';
    const ts = req.header('X-Relavoi-Timestamp') ?? '';
    const v1 = sigHeader.split(',').find((p) => p.startsWith('v1='))?.slice(3);

    if (!v1 || !ts) return res.status(400).end();
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return res.status(400).end();

    const expected = crypto
      .createHmac('sha256', SECRET)
      .update(`${ts}.${req.body.toString('utf8')}`)
      .digest('hex');

    const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
    if (!ok) return res.status(401).end();

    const event = JSON.parse(req.body.toString('utf8'));
    // handle event.type ...
    res.status(200).end();
  },
);
```

### Python

```python
import hmac, hashlib, time
from flask import Flask, request, abort

app = Flask(__name__)
SECRET = os.environ["RELAVOI_WEBHOOK_SECRET"].encode()

@app.post("/relavoi/webhooks")
def handle():
    ts = request.headers.get("X-Relavoi-Timestamp", "")
    sig = request.headers.get("X-Relavoi-Signature", "")
    v1 = next((p[3:] for p in sig.split(",") if p.startswith("v1=")), None)

    if not ts or not v1:
        abort(400)
    if abs(time.time() - int(ts)) > 300:
        abort(400)

    signing = f"{ts}.{request.get_data(as_text=True)}".encode()
    expected = hmac.new(SECRET, signing, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, v1):
        abort(401)

    event = request.get_json()
    # handle event["type"] ...
    return "", 200
```

### Go

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "io"
    "net/http"
    "os"
    "strconv"
    "strings"
    "time"
)

var secret = []byte(os.Getenv("RELAVOI_WEBHOOK_SECRET"))

func handle(w http.ResponseWriter, r *http.Request) {
    ts := r.Header.Get("X-Relavoi-Timestamp")
    sig := r.Header.Get("X-Relavoi-Signature")

    var v1 string
    for _, p := range strings.Split(sig, ",") {
        if strings.HasPrefix(p, "v1=") {
            v1 = strings.TrimPrefix(p, "v1=")
        }
    }

    tsInt, err := strconv.ParseInt(ts, 10, 64)
    if err != nil || v1 == "" {
        http.Error(w, "bad headers", http.StatusBadRequest)
        return
    }
    if abs(time.Now().Unix()-tsInt) > 300 {
        http.Error(w, "stale", http.StatusBadRequest)
        return
    }

    body, _ := io.ReadAll(r.Body)
    mac := hmac.New(sha256.New, secret)
    mac.Write([]byte(ts + "." + string(body)))
    expected := hex.EncodeToString(mac.Sum(nil))

    if !hmac.Equal([]byte(expected), []byte(v1)) {
        http.Error(w, "bad sig", http.StatusUnauthorized)
        return
    }
    // handle event ...
    w.WriteHeader(http.StatusOK)
}

func abs(x int64) int64 { if x < 0 { return -x }; return x }
```

## 5. Retry policy

If your endpoint returns anything other than `2xx` within 5 seconds, Relavoi retries with exponential backoff:

| Attempt | Delay after previous |
|---------|----------------------|
| 1 | (initial) |
| 2 | 30 seconds |
| 3 | 2 minutes |
| 4 | 10 minutes |

After the fourth attempt the event goes to the dead-letter queue, visible at `GET /v1/webhooks/logs`. You can replay any DLQ event from the dashboard.

:::tip Idempotency
Always treat webhook delivery as at-least-once. Use the `id` field of the payload as your idempotency key.
:::
