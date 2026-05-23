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
| apiKey | string | yes | The `sk_live_...` key from signup |
| apiSecret | string | yes | The 64-char hex secret |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk_live_YOUR_API_KEY_HERE",
    "apiSecret": "f3a9c7b1d8e4f5a6b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5"
  }'
```

**Response**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tier": "GROWTH"
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
| workspaceName | string | yes | Human label for the tenant |
| adminEmail | string | yes | Initial admin user |
| adminPassword | string | yes | Min 12 chars, mixed case, digit |
| country | string | yes | ISO-3166 alpha-2, currently `NG` only |
| tier | string | no | `STARTER` (default), `GROWTH`, `ENTERPRISE` |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceName": "Chowdeck Production",
    "adminEmail": "ops@example.com",
    "adminPassword": "YOUR_PASSWORD",
    "country": "NG",
    "tier": "GROWTH"
  }'
```

**Response**

```json
{
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "apiKey": "sk_live_YOUR_API_KEY_HERE",
  "apiSecret": "f3a9c7b1d8e4f5a6b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5",
  "tier": "GROWTH"
}
```

:::danger
The plaintext `apiSecret` is returned exactly once. Store it immediately.
:::

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | validation | Weak password or unsupported country |
| 409 | conflict | Email already in use |

---

### POST /v1/auth/dashboard/login

Auth: none.

Dashboard login flow for human operators. Returns a `typ=user` JWT that grants access to dashboard endpoints (analytics, billing, webhook config) but not SDK endpoints.

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
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "usr_5e6f7a8b",
    "email": "ops@example.com",
    "role": "ADMIN"
  },
  "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | unauthorized | Bad email or password |
| 429 | rate-limit | More than 5 attempts per minute per IP |

---

### POST /v1/auth/rotate-key

Auth: Bearer JWT (tenant) **or** Bearer JWT (user with ADMIN role).

Issues a new API key + secret pair and revokes the old one immediately. All SDK clients using the old credentials will fail their next JWT refresh and must be redeployed.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | no | Audit annotation (e.g. `"leaked-on-github"`) |

**Request**

```bash
curl -X POST https://api.relavoi.com/v1/auth/rotate-key \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "reason": "scheduled-quarterly-rotation" }'
```

**Response**

```json
{
  "apiKey": "sk_live_YOUR_API_KEY_HERE",
  "apiSecret": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5f6a7b8c9d0e1f2a3",
  "rotatedAt": "2026-05-22T14:30:00Z"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | unauthorized | Missing or invalid JWT |
| 403 | forbidden | User JWT without ADMIN role |
