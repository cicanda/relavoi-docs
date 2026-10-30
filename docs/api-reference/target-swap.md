---
title: Swap Session Target
sidebar_label: Target Swap
description: Change the customer (party B) in an active session without creating a new session. The proxy number stays the same, so one allocation can serve a run of sequential calls.
---

# Swap Session Target

Change the customer (party B) on an active session without creating a new one. The proxy number does not change, so the agent keeps dialling the same number and each call connects to whoever the current target is.

## Why

The obvious way to call ten customers is ten sessions. That takes ten numbers from your pool, and each one sits in cooldown after it is released, so on a modest pool you run out partway through the round and start getting `503 pool-exhausted`.

A target swap keeps one allocation for the whole run:

```
create session  (agent, customer 1)  -> proxy +234...
  call  -> customer 1
swap target     (customer 2)         -> same proxy
  call  -> customer 2
swap target     (customer 3)         -> same proxy
  call  -> customer 3
end session                          -> one number released, once
```

One number, one cooldown, however many recipients.

---

### PATCH /v1/sessions/:id/target

Auth: Bearer JWT (tenant), the same as the rest of the sessions API.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| customerPhone | string | yes | E.164, e.g. `+2349090000002`. Becomes the new party B. |

**Request**

```bash
curl -X PATCH https://api.relavoi.com/v1/sessions/67701c43-2a23-4233-b723-80d2b94dacf5/target \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerPhone":"+2349090000002"}'
```

**Response** `200 OK`, the full session, identical in shape to `GET /v1/sessions/:id`:

```json
{
  "id": "67701c43-2a23-4233-b723-80d2b94dacf5",
  "tenantId": "f656ac1b-3b5d-4af0-8ff1-c4cbc1076144",
  "proxyNumber": "+2342017001428",
  "state": "ACTIVE",
  "directionMode": "BIDIRECTIONAL",
  "metadata": { "orderId": "ORD-9281" },
  "gracePeriodMinutes": 15,
  "maxDurationMinutes": 120,
  "recordingEnabled": false,
  "consentPrompt": "NONE",
  "expiresAt": "2026-10-02T22:24:15.746Z",
  "createdAt": "2026-10-02T20:24:15.746Z",
  "callCount": 3
}
```

`proxyNumber` is unchanged. Real phone numbers are never returned, so the new target is not echoed back; the session is simply now pointed at it.

### Errors

| Status | Type | When |
|--------|------|------|
| 400 | `validation` | `customerPhone` missing, or not valid E.164 |
| 404 | `not-found` | No such session for this tenant |
| 409 | `target-conflict` | The session is not `ACTIVE` or `GRACE_PERIOD`, or the new target already participates in another live session on this proxy number |
| 422 | `invalid-target` | The new target is the agent's own number |

Errors are [RFC 7807 problem documents](./errors).

The conflict case is the same rule that governs allocation: one proxy may carry several concurrent sessions, but never two that share a participant, or an inbound call could not be attributed. If the swap is refused for conflict, use a second session on a different number for that recipient.

### Idempotency

Swapping to the number that is already the target returns `200` with the unchanged session. No audit entry and no event are written. Retrying a swap is safe.

## Behaviour after a swap

**Callbacks.** The previous customer can no longer reach the proxy. Their number is unwired from the session the moment the swap lands, so a call from them gets your tenant's configured `expiredCallBehavior` (dead line, redirect to support, or a custom message) rather than the agent. Tell your users the number is good for the current delivery only, or keep the old session alive on a second number if callbacks matter.

**Call records are preserved.** Swapping rewrites nothing historical. A session with three swaps and ten calls still has ten call records. Each one carries `partyBPhoneHash`, the hashed target in force when that call was routed, so you can attribute every call to the recipient it actually reached without storing a number against it.

**SMS follows the current target.** After a swap, a message from the agent to the proxy goes to the new customer. A message from the previous customer no longer matches the session and is dropped.

**Direction mode is unaffected.** `A_TO_B_ONLY` keeps letting the agent call out to each new target while none of them can call back. `BIDIRECTIONAL` lets the current target call in. `B_TO_A_ONLY` changes which single person can reach the agent.

**Session timing is unaffected.** `expiresAt`, `gracePeriodMinutes` and `maxDurationMinutes` all carry over. A swap does not extend a session, so budget the whole run inside one `maxDurationMinutes` window, or extend it with `PATCH /v1/sessions/:id`.

## Audit trail

Every swap writes an `audit_log` entry with action `session.target_swapped`, recording the previous and new party B **hashes**. Phone numbers never enter the audit table. Cross-reference the entry timestamps with call records to reconstruct who was reached when.

A `session.target_swapped` event is also published to your webhook endpoint and WebSocket stream, carrying `sessionId`, `tenantId`, `proxyNumber` and `timestamp`, and no phone numbers.

## SDKs

All three SDKs expose this as `swapTarget`. See [iOS](../sdks/ios/installation), [Android](../sdks/android/installation) and [Flutter](../sdks/flutter/installation).
