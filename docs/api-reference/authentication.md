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
