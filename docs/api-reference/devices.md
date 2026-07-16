---
title: Device Tokens & Presence API
sidebar_label: Devices
description: Register push tokens and report device presence so masked-call notifications reach the right handset.
---

# Device Tokens & Presence API

These endpoints are used by the Relavoi SDK to register APNs/FCM push tokens and to report device presence (app foreground state / reachability). The Push Notification Service uses this data to deliver branded call notifications to the correct device.

Auth: Bearer JWT — a tenant SDK token (`POST /auth/token`) or a dashboard user token. All phone numbers are E.164 (`+234XXXXXXXXXX`).

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| POST | `/v1/devices/token` | Register or refresh a push token |
| DELETE | `/v1/devices/token` | Deactivate a push token |
| POST | `/v1/devices/presence` | Report device presence |
| GET | `/v1/devices/presence` | Query current presence for a user |

---

### POST /v1/devices/token

Registers a new APNs/FCM device token or refreshes an existing one. The operation upserts on `token`, so calling it repeatedly with the same token is safe and idempotent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userPhone | string | yes | End-user phone in E.164, e.g. `+2348012345678` |
| token | string | yes | APNs or FCM device token |
| platform | string | yes | `ios` or `android` |
| appBundleId | string | no | Client app bundle identifier |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/devices/token \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "userPhone": "+2348012345678",
    "token": "fcm_ekQ9...c1a",
    "platform": "android",
    "appBundleId": "com.chowdeck.rider"
  }'
```

**Response**

`204 No Content` — empty body. The token is registered/refreshed.

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation-error | Missing/invalid field, or bad `platform` |
| 401 | unauthorized | Missing or invalid JWT |

---

### DELETE /v1/devices/token

Deactivates a push token, e.g. on logout or when the OS reports the token is stale.

:::note
The token is sent in the **request body**, not as a query parameter.
:::

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | yes | The device token to deactivate |

**Request**

```bash
curl -X DELETE https://api.relavoi.com/v1/devices/token \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "token": "fcm_ekQ9...c1a" }'
```

**Response**

`204 No Content` — empty body. The token is deactivated.

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation-error | Missing `token` |
| 401 | unauthorized | Missing or invalid JWT |

---

### POST /v1/devices/presence

Reports a device's presence state. The SDK typically calls this on app foreground/background transitions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userPhone | string | yes | End-user phone in E.164 |
| status | string | yes | `online`, `background`, or `offline` |
| platform | string | yes | `ios` or `android` |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/devices/presence \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "userPhone": "+2348012345678",
    "status": "online",
    "platform": "android"
  }'
```

**Response**

`204 No Content` — empty body.

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation-error | Invalid `status` or missing field |
| 401 | unauthorized | Missing or invalid JWT |

---

### GET /v1/devices/presence

Returns the most recently reported presence for a user.

| Query | Type | Required | Description |
|-------|------|----------|-------------|
| userPhone | string | yes | End-user phone in E.164 |

**Request**

```bash
curl "https://api.relavoi.com/v1/devices/presence?userPhone=+2348012345678" \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "status": "online",
  "platform": "android",
  "ts": 1784117735810
}
```

`ts` is the presence timestamp in epoch milliseconds. If no presence has been reported for the user, the response reflects an unknown/offline state.

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation-error | Missing `userPhone` |
| 401 | unauthorized | Missing or invalid JWT |
