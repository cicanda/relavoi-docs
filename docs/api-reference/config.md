---
title: Tenant Config API
sidebar_label: Config
description: Read and update your tenant configuration, covering webhook URL, grace period, expired-call behavior and support routing.
---

# Tenant Config API

These endpoints expose your tenant's configuration: default session behavior, expired-call handling and support routing.

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
| tier | string | `STARTER`, `GROWTH`, `SCALE`, or `ENTERPRISE` |
| status | string | Tenant status, e.g. `ACTIVE` |
| webhookUrl | string \| null | Registered client webhook URL |
| defaultGracePeriod | integer | Default grace period (minutes) for new sessions |
| expiredCallBehavior | string | `DEAD_LINE`, `REDIRECT_SUPPORT`, or `PLAY_MESSAGE` |
| expiredMessage | string \| null | What a caller hears under `PLAY_MESSAGE`. Plain text, up to 300 characters |
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
| expiredMessage | string \| null | The line spoken to a caller when the behaviour is `PLAY_MESSAGE`. Plain text, 300 characters, no angle brackets. **Required for `PLAY_MESSAGE`:** that behaviour with no message is refused with `422 expired-message-required`, because the caller would otherwise hear the standard out-of-service line while your config said otherwise |
| supportPhone | string | Support number. A Nigerian **mobile or landline**, since a support line often is not a mobile. Normalised to E.164; anything else is a `422 number-not-supported`. This number is dialled by the carrier, so a foreign number is refused here |
| recordingEnabled | boolean | Enable/disable call recording |
| recordingConsentMode | string | `DEFAULT`, `CUSTOM`, or `NONE` |
| recordingConsentAudioUrl | string | URL of custom consent audio |
| pushConfig | object | Push notification config |

:::note Recording is not available
The recording fields are returned by `GET /config`, because they exist on your
tenant row, and they are listed above so this reference matches what you will
actually see. Setting `recordingEnabled` to `true` is refused with `422
feature-not-available`. See [Not built yet](../introduction#not-built-yet).
:::

### `pushConfig`

The wording of the notification sent to a customer before a call, and whether
to send one at all.

| Key | Type | Effect |
|-----|------|--------|
| `push_enabled` | boolean | `false` stops notifications for the workspace. Defaults to on |
| `push_title_template` | string | Notification title |
| `push_body_template` | string | Notification body |

`{tenant_name}` and `{order_id}` are filled in, the second from the reference
your app put in the session's `metadata` (`orderId`, `order_id` or
`reference`). A placeholder we cannot fill is replaced with nothing, so do not
invent your own.

:::caution Nothing is delivered yet
These three keys are read and applied, which they were not until recently: the
dashboard wrote them under these names while the service looked for `title`
and `body`, so every notification used the built-in wording and the enabled
switch did nothing. Both spellings now work.

What still does not work is delivery. No push credentials are configured in
production, so no notification reaches a device however this is set. Device
token registration is the half that works. See
[Not built yet](../introduction#not-built-yet).
:::

**Request**

```bash
curl -X PATCH https://api.relavoi.com/v1/config \
  -H "Authorization: Bearer $RELAVOI_DASHBOARD_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://client.example.com/hook",
    "expiredCallBehavior": "REDIRECT_SUPPORT",
    "supportPhone": "+2348000000001"
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
  "recordingEnabled": false,
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
| 400 | validation-error | Invalid enum, or a field outside its allowed range |
| 422 | feature-not-available | `recordingEnabled=true`. Recording is not available |
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
