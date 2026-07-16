---
title: Sign up and get API credentials
sidebar_label: Sign up
description: Create your Relavoi tenant, capture your API key and secret, and stash them in a .env file before your first call.
---

# Sign up and get API credentials

Provisioning a Relavoi tenant takes one API call and roughly two minutes. You will leave with an `apiKey`, an `apiSecret`, and a `tenantId` — exactly the inputs every SDK and API call needs.

## Step 1 — Create your tenant

Sign up with a single `POST /v1/auth/signup` request. The endpoint accepts exactly these fields:

| Field | Required | Notes |
|-------|----------|-------|
| `companyName` | yes | Your company or brand name |
| `email` | yes | Owner login email |
| `password` | yes | Minimum 8 characters |
| `companySize` | no | Optional free-form string (e.g. `"11-50"`) |
| `useCase` | no | Optional free-form string (e.g. `"delivery"`) |

```bash
curl -X POST https://api.relavoi.com/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Chowdeck",
    "email": "dev@example.com",
    "password": "a-strong-password",
    "companySize": "11-50",
    "useCase": "delivery"
  }'
```

The endpoint creates a tenant record, generates an API key pair, and returns them along with a short-lived access token. New tenants always start on the **STARTER** tier — you can upgrade later from the dashboard. Any extra fields you send are ignored.

Response:

```json
{
  "tenantId": "058784e8-6755-49d3-a3da-e11550dd3e29",
  "apiKey": "rk_live_YOUR_API_KEY_HERE",
  "apiSecret": "rs_YOUR_API_SECRET_HERE",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "0c95072b-7e4e-42a1-a556-42127c60ef3c",
    "email": "dev@example.com",
    "role": "OWNER",
    "tenantId": "058784e8-6755-49d3-a3da-e11550dd3e29"
  }
}
```

:::tip Prefer the dashboard?
You can also sign up at [https://app.relavoi.com/signup](https://app.relavoi.com/signup). The dashboard collects the same fields and shows your credentials on the **API Keys** screen after creation.
:::

## Step 2 — Copy your key and secret (one-time)

The signup response is the only time your `apiSecret` is shown in full. Capture all three values now:

- `RELAVOI_API_KEY` — the `apiKey`, which looks like `rk_live_YOUR_API_KEY_HERE...` (prefix `rk_live_` followed by 48 hex characters)
- `RELAVOI_API_SECRET` — the `apiSecret`, which looks like `rs_e028efcc...` (prefix `rs_` followed by 64 hex characters)
- `RELAVOI_TENANT_ID` — the `tenantId` UUID

:::danger Save these now
The API key and secret are hashed before they touch our database. We physically cannot show them to you again. If you lose them, you must rotate the pair from the dashboard, which invalidates the old pair immediately.
:::

## Step 3 — Save them to a .env file

Add the credentials to a local `.env` file (and to your secret manager for production):

```bash
RELAVOI_API_KEY=rk_live_YOUR_API_KEY_HERE
RELAVOI_API_SECRET=rs_YOUR_API_SECRET_HERE
RELAVOI_TENANT_ID=058784e8-6755-49d3-a3da-e11550dd3e29
```

Make sure `.env` is listed in `.gitignore`. The Android and iOS SDKs read these through `BuildConfig` and Info.plist respectively — see [Android initialization](../sdks/android/initialization) and [iOS initialization](../sdks/ios/initialization).

## Step 4 — Verify

The signup response already includes an `accessToken`, but that JWT expires after 15 minutes. To confirm your long-lived key and secret work, exchange them for a fresh token:

```bash
curl -X POST https://api.relavoi.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$RELAVOI_API_KEY\",
    \"apiSecret\": \"$RELAVOI_API_SECRET\"
  }"
```

A `200 OK` carrying an `accessToken` means you are ready for [Your first session](./first-session).
