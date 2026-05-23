---
title: Sign up and get API credentials
sidebar_label: Sign up
description: Create your Relavoi workspace, capture your API key and secret, and stash them in a .env file before your first call.
---

# Sign up and get API credentials

Provisioning a Relavoi workspace takes three steps and roughly two minutes. You will leave with an `apiKey`, an `apiSecret`, and a `tenantId` — exactly the inputs every SDK and API call needs.

## Step 1 — Create your workspace

Open [https://app.relavoi.com/signup](https://app.relavoi.com/signup) in your browser. Provide:

- Workspace name (e.g. `Chowdeck Production`)
- Admin email and password
- Country (Nigeria is the only supported region at GA)
- Initial pricing tier (you can upgrade later)

The dashboard creates a tenant record, generates an API key pair, and assigns you a UUID `tenantId`.

:::tip Dashboard signup is the recommended path
Programmatic signup via `POST /v1/auth/signup` is documented in the [Authentication reference](../api-reference/authentication), but for a first run the dashboard is faster — it walks you through webhook URL setup and recording defaults in the same flow.
:::

## Step 2 — Copy your key and secret (one-time)

After signup the dashboard displays your credentials on the **API Keys** screen:

- `RELAVOI_API_KEY` — looks like `sk_live_YOUR_API_KEY_HERE...`
- `RELAVOI_API_SECRET` — a 64-character hex string
- `RELAVOI_TENANT_ID` — the workspace UUID

:::danger Save these now
The API key is hashed with SHA-256 and the secret is hashed with bcrypt before either touches our database. We physically cannot show them to you again. If you lose them, you must rotate via `POST /v1/auth/rotate-key`, which invalidates the old pair immediately.
:::

## Step 3 — Save them to a .env file

Add the credentials to a local `.env` file (and to your secret manager for production):

```bash
RELAVOI_API_KEY=sk_live_YOUR_API_KEY_HERE
RELAVOI_API_SECRET=f3a9c7b1d8e4f5a6b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5
RELAVOI_TENANT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Make sure `.env` is listed in `.gitignore`. The Android and iOS SDKs read these through `BuildConfig` and Info.plist respectively — see [Android initialization](../sdks/android/initialization) and [iOS initialization](../sdks/ios/initialization).

## Step 4 — Verify

A quick smoke test against the auth endpoint confirms your credentials work:

```bash
curl -X POST https://api.relavoi.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$RELAVOI_API_KEY\",
    \"apiSecret\": \"$RELAVOI_API_SECRET\"
  }"
```

A `200 OK` with a JWT means you are ready for [Your first session](./first-session).
