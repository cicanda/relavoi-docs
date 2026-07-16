---
title: Tenant Config API
sidebar_label: Config
description: Read and update your tenant configuration — webhook URL, grace period, expired-call behavior, and recording settings.
---

# Tenant Config API

These endpoints expose your tenant's configuration: default session behavior, expired-call handling, support routing, push settings, and call-recording policy.

Auth: Bearer JWT. Reads work with any tenant token; `PATCH /config` requires a dashboard user token with an `OWNER` or `ADMIN` role.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/config` | Get the tenant config |
| PATCH | `/v1/config` | Update the tenant config (OWNER/ADMIN) |
| GET | `/v1/tenants/me` | Get the current tenant (wrapped) |

---

### GET /v1/config

Returns the full tenant configuration object.

**Request**

```bash
curl https://api.relavoi.com/v1/config \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Chowdeck",
  "tier": "GROWTH",
  "status": "ACTIVE",
  "webhookUrl": null,
  "defaultGracePeriod": 15,
  "expiredCallBehavior": "DEAD_LINE",
  "supportPhone": null,
  "recordingEnabled": false,
  "recordingConsentMode": "DEFAULT",
  "recordingConsentAudioUrl": null,
  "pushConfig": {},
  "createdAt": "2026-07-11T20:44:05.776Z",
  "updatedAt": "2026-07-11T20:44:05.776Z"
}
```

**Field reference**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Tenant UUID |
| name | string | Tenant display name |
| tier | string | `STARTER`, `GROWTH`, or `ENTERPRISE` |
| status | string | Tenant status, e.g. `ACTIVE` |
| webhookUrl | string \| null | Registered client webhook URL |
| defaultGracePeriod | integer | Default grace period (minutes) for new sessions |
| expiredCallBehavior | string | `DEAD_LINE`, `REDIRECT_SUPPORT`, or `PLAY_MESSAGE` |
| supportPhone | string \| null | Support number (used by `REDIRECT_SUPPORT`) |
| recordingEnabled | boolean | Whether call recording is enabled |
| recordingConsentMode | string | `DEFAULT`, `CUSTOM`, or `NONE` |
| recordingConsentAudioUrl | string \| null | URL of custom consent audio (for `CUSTOM`) |
| pushConfig | object | Per-tenant push notification config |
| createdAt | string | ISO-8601 timestamp |
| updatedAt | string | ISO-8601 timestamp |

---

### PATCH /v1/config

Updates one or more configuration fields. Only the fields you send are changed. Requires a dashboard user token with `OWNER` or `ADMIN` role.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Tenant display name |
| webhookUrl | string | Client webhook URL |
| defaultGracePeriod | integer | Default grace period (minutes) |
| expiredCallBehavior | string | `DEAD_LINE`, `REDIRECT_SUPPORT`, or `PLAY_MESSAGE` |
| supportPhone | string | Support number in E.164 |
| recordingEnabled | boolean | Enable/disable call recording |
| recordingConsentMode | string | `DEFAULT`, `CUSTOM`, or `NONE` |
| recordingConsentAudioUrl | string | URL of custom consent audio |
| pushConfig | object | Push notification config |

:::warning Recording consent is enforced
If `recordingEnabled` is `true`, `recordingConsentMode` cannot be `NONE`. This is an NDPR compliance requirement — a consent announcement must play before calls are bridged. A request that would leave recording enabled with consent disabled is rejected with `400`.
:::

**Request**

```bash
curl -X PATCH https://api.relavoi.com/v1/config \
  -H "Authorization: Bearer $RELAVOI_DASHBOARD_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://client.example.com/hook",
    "expiredCallBehavior": "REDIRECT_SUPPORT",
    "supportPhone": "+2348000000001",
    "recordingEnabled": true,
    "recordingConsentMode": "DEFAULT"
  }'
```

**Response**

Returns the full, updated config object (same shape as `GET /config`).

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Chowdeck",
  "tier": "GROWTH",
  "status": "ACTIVE",
  "webhookUrl": "https://client.example.com/hook",
  "defaultGracePeriod": 15,
  "expiredCallBehavior": "REDIRECT_SUPPORT",
  "supportPhone": "+2348000000001",
  "recordingEnabled": true,
  "recordingConsentMode": "DEFAULT",
  "recordingConsentAudioUrl": null,
  "pushConfig": {},
  "createdAt": "2026-07-11T20:44:05.776Z",
  "updatedAt": "2026-07-15T12:15:35.907Z"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation-error | Invalid enum, or `recordingEnabled=true` with `recordingConsentMode=NONE` |
| 401 | unauthorized | Missing or invalid JWT |
| 403 | forbidden | Not an OWNER/ADMIN dashboard token |

---

### GET /v1/tenants/me

Returns the same tenant fields as `GET /config`, wrapped in a `tenant` object. Useful for dashboard clients that resolve the signed-in tenant on load.

**Request**

```bash
curl https://api.relavoi.com/v1/tenants/me \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

**Response**

```json
{
  "tenant": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Chowdeck",
    "tier": "GROWTH",
    "status": "ACTIVE",
    "webhookUrl": null,
    "defaultGracePeriod": 15,
    "expiredCallBehavior": "DEAD_LINE",
    "supportPhone": null,
    "recordingEnabled": false,
    "recordingConsentMode": "DEFAULT",
    "recordingConsentAudioUrl": null,
    "pushConfig": {},
    "createdAt": "2026-07-11T20:44:05.776Z",
    "updatedAt": "2026-07-11T20:44:05.776Z"
  }
}
```
