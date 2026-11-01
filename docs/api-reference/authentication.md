---
title: Authentication
sidebar_label: Authentication
description: Exchange API credentials for JWTs, sign up programmatically, log in to the dashboard, and rotate keys.
---

# Authentication

Relavoi uses two distinct credential types:

- **API key + secret** (SDK / backend integrations) trade for a **15-minute JWT** with `typ=tenant`
- **Email + password** (dashboard users) trade for a longer-lived JWT with `typ=user`

The two JWT types cannot be used interchangeably. Endpoints documented under "API Reference" require a `typ=tenant` token unless noted.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| POST | `/v1/auth/token` | Exchange API key + secret for a JWT |
| POST | `/v1/auth/sdk-token` | Mint a short-lived, scoped token for one user's device |
| POST | `/v1/auth/signup` | Programmatically create a new tenant |
| POST | `/v1/auth/dashboard/login` | Dashboard user login (email + password) |
| POST | `/v1/auth/rotate-key` | Rotate API key + secret pair |

---

### POST /v1/auth/token

Auth: none (this is the bootstrap endpoint).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| apiKey | string | yes | The `rk_live_...` key from signup (`rk_live_` + 48 hex chars) |
| apiSecret | string | yes | The `rs_...` secret (`rs_` + 64 hex chars) |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "rk_live_YOUR_API_KEY_HERE",
    "apiSecret": "rs_YOUR_API_SECRET_HERE"
  }'
```

**Response**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Missing or malformed fields |
| 401 | unauthorized | Wrong key or secret |
| 429 | rate-limit | More than 10 token requests per minute per key |

---

### POST /v1/auth/sdk-token

Auth: a tenant JWT from `/v1/auth/token`, or a dashboard token. A device token
cannot mint another.

Call this from **your own backend**. It returns a token for one user, carrying
only the scopes you ask for, which is what you hand your mobile app. The API
secret stays on your server: anything compiled into a published app can be read
back out of it, and a live pair lets anyone create sessions billed to you and
list every session and call on your workspace.

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/auth/sdk-token \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "userPhone": "+2348012345678",
    "scope": ["sessions:verify", "sessions:read", "devices:write"]
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userPhone | string | yes | The user this token is for. A Nigerian mobile number |
| scope | string[] | yes | One or more of `sessions:verify`, `sessions:read`, `devices:write` |
| ttlSeconds | integer | no | Default 900. Clamped into 60..900 rather than refused |

**Response**

```json
{
  "accessToken": "eyJ...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "scope": ["devices:write", "sessions:read", "sessions:verify"],
  "subject": "+234******5678"
}
```

The number is never returned whole, and the token carries a hash of it rather
than the number itself.

**Scopes**

| Scope | Reaches |
|-------|---------|
| `sessions:verify` | `GET` and `POST /v1/sessions/verify` |
| `sessions:read` | `GET /v1/sessions/{id}`, and only sessions this user is a party to |
| `devices:write` | `POST` and `DELETE /v1/devices/token`, `POST /v1/devices/presence` |

Everything else answers `403 scope-not-permitted`, whatever scopes the token
holds: creating, ending or retargeting a session, listing the workspace's
sessions or calls, and anything under `/config`, `/billing`, `/webhooks`,
`/numbers` or `/auth/keys`. The WebSocket stream refuses device tokens too.

Reading a session the user is not a party to answers `404`, the same as a
session that does not exist, so a handset cannot enumerate a workspace.

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation-error | Unknown scope, or a malformed body |
| 401 | unauthorized | Missing or invalid JWT |
| 403 | scope-not-permitted | A device token tried to mint another |
| 422 | number-not-supported | `userPhone` is not a Nigerian mobile number |

See [SDK tokens](../guides/sdk-tokens) for the whole picture, including the
`tokenProvider` form of `initialize()` in each SDK.

---

### POST /v1/auth/signup

Auth: none.

Programmatic tenant provisioning. The dashboard wraps this with extra UX, but you can call it directly if you are bootstrapping many workspaces (e.g. multi-brand marketplaces).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| companyName | string | yes | Human label for the tenant (1-255 chars) |
| email | string | yes | Initial owner user email |
| password | string | yes | 8-128 chars |
| companySize | string | no | Optional onboarding hint |
| useCase | string | no | Optional onboarding hint |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Chowdeck Production",
    "email": "ops@example.com",
    "password": "YOUR_PASSWORD",
    "companySize": "50-200",
    "useCase": "delivery"
  }'
```

**Response**

New tenants are created on the `STARTER` tier. The response returns the API credentials once, plus an initial `accessToken` (15-minute JWT) so you can start calling the API immediately.

```json
{
  "tenantId": "058784e8-6755-49d3-a3da-e11550dd3e29",
  "apiKey": "rk_live_YOUR_API_KEY_HERE",
  "apiSecret": "rs_YOUR_API_SECRET_HERE",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "0c95072b-7e4e-42a1-a556-42127c60ef3c",
    "email": "ops@example.com",
    "role": "OWNER",
    "tenantId": "058784e8-6755-49d3-a3da-e11550dd3e29"
  }
}
```

:::danger
The plaintext `apiSecret` is returned exactly once. Store it immediately.
:::

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Missing or malformed fields (e.g. password shorter than 8 chars) |
| 409 | conflict | Email or company already in use |

---

### POST /v1/auth/dashboard/login

Auth: none.

Dashboard login flow for human operators. Returns a longer-lived dashboard JWT (24h) that grants access to owner/dashboard endpoints (analytics, billing, webhook config, number provisioning) in addition to the standard API endpoints.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | yes | Admin or operator email |
| password | string | yes | User password |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/auth/dashboard/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ops@example.com",
    "password": "YOUR_PASSWORD"
  }'
```

**Response**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "57f24ff5-953e-470e-9a1c-e2e99f0c41dd",
    "email": "ops@example.com",
    "role": "OWNER",
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "tenant": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Chowdeck",
    "tier": "GROWTH",
    "status": "ACTIVE"
  }
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | unauthorized | Bad email or password |
| 429 | rate-limit | More than 5 attempts per minute per IP |

---

### POST /v1/auth/rotate-key

Auth: Bearer dashboard JWT with `OWNER` role (obtained from `/auth/dashboard/login`).

Issues a new API key + secret pair and revokes the old one immediately. All SDK clients using the old credentials will fail their next JWT refresh and must be redeployed. The request takes no body.

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/auth/rotate-key \
  -H "Authorization: Bearer $RELAVOI_DASHBOARD_JWT"
```

**Response**

```json
{
  "apiKey": "rk_live_YOUR_API_KEY_HERE",
  "apiSecret": "rs_YOUR_API_SECRET_HERE"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | unauthorized | Missing or invalid JWT |
| 403 | forbidden | Not an `OWNER` dashboard user |
