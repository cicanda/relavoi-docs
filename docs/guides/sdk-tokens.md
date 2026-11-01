---
title: SDK tokens
sidebar_label: SDK tokens
description: Why the API secret must not ship inside an app, and how to mint short-lived device tokens from your own backend instead.
---

# SDK tokens

Your app should hold no Relavoi secret at all. This is how.

## The problem

Until SDK 0.3.0 every SDK took your API key and secret at `initialize()`, and
the natural place to put them was `BuildConfig`, `Info.plist` or a
`--dart-define`. All three end up as constants in the shipped binary.

An app bundle is an archive. `BuildConfig` constants land in `classes.dex` as
string literals and `Info.plist` is a file in the IPA, so pulling both out is
`unzip` plus `strings`. Obfuscation moves that from seconds to minutes and no
further, because the value has to be in memory in plaintext for the SDK to send
it.

So a live key and secret in a published app is a credential anyone who installs
it can take. With it they can:

- create sessions, each allocating a proxy number and billing against your
  included minutes and then your wallet
- list every session on your workspace, with the `metadata` you attached, which
  is usually order ids
- list every call record: times, durations, outcomes
- retarget a live session at a different customer
- read your config and your wallet balance

Phone numbers stay masked throughout. Everything else above is your operational
record, and session creation is your money.

## The fix

Your backend already holds the secret. Let it keep it.

```text
   your app  ──ask──▶  your backend  ──POST /v1/auth/sdk-token──▶  Relavoi
       ▲                     │
       └──── device token ◀──┘
```

Your backend exchanges its key and secret for a tenant token the usual way, and
then mints a **device token**: one user, a short list of scopes, fifteen
minutes. The app never sees the secret, so there is nothing in it worth
extracting.

### On your backend

```js
const tenant = await fetch("https://api.relavoi.com/v1/auth/token", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ apiKey: RELAVOI_API_KEY, apiSecret: RELAVOI_API_SECRET }),
}).then((r) => r.json());

const device = await fetch("https://api.relavoi.com/v1/auth/sdk-token", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${tenant.accessToken}`,
  },
  body: JSON.stringify({
    userPhone: "+2348012345678",
    scope: ["sessions:verify", "sessions:read", "devices:write"],
  }),
}).then((r) => r.json());

// { accessToken, expiresIn: 900, scope: [...], subject: "+234******5678" }
```

```python
import requests

tenant = requests.post(
    "https://api.relavoi.com/v1/auth/token",
    json={"apiKey": RELAVOI_API_KEY, "apiSecret": RELAVOI_API_SECRET},
).json()

device = requests.post(
    "https://api.relavoi.com/v1/auth/sdk-token",
    headers={"authorization": f"Bearer {tenant['accessToken']}"},
    json={
        "userPhone": "+2348012345678",
        "scope": ["sessions:verify", "sessions:read", "devices:write"],
    },
).json()
```

Your backend decides who gets one. It knows which user is signed in; we cannot.

### In your app

```kotlin
Relavoi.initialize(
  context = applicationContext,
  tenantId = BuildConfig.RELAVOI_TENANT_ID,
  tokenProvider = { myBackend.relavoiToken() },
)
```

```swift
Relavoi.initialize(tenantId: "your-tenant-uuid") {
  let t = try await MyBackend.relavoiToken()
  return RelavoiToken(accessToken: t.accessToken, expiresIn: t.expiresIn)
}
```

```dart
await Relavoi.initialize(
  tenantId: 'your-tenant-uuid',
  tokenProvider: () async => myBackend.relavoiToken(),
);
```

The SDK calls your provider on first use, shortly before the current token
expires, and once after a 401. It caches the token in memory for its lifetime,
so a provider that costs a network round trip is called roughly four times an
hour, not on every request.

A provider token is deliberately **not** persisted to the Keychain or to
encrypted preferences. It is already short-lived, your provider can always
produce another, and a stored one would outlive a sign-out in your app.

If your provider throws, the error surfaces to whoever called the SDK rather
than being retried in a loop. A failing provider usually means the user is
signed out of your app, and the right answer is to stop.

## Scopes

| Scope | Reaches |
|---|---|
| `sessions:verify` | `GET` and `POST /sessions/verify`. The in-call banner |
| `sessions:read` | `GET /sessions/{id}`, and only sessions this user is a party to |
| `devices:write` | `POST` and `DELETE /devices/token`, `POST /devices/presence` |

Ask for the narrowest set that works. A verification banner needs only
`sessions:verify`.

### What a device token can never do

Everything else answers `403 scope-not-permitted`, whatever scopes the token
carries:

- create, end or retarget a session
- list the workspace's sessions or calls
- anything under `/config`, `/billing`, `/webhooks`, `/numbers` or `/auth/keys`
- mint another device token

Session creation belongs on your backend, because that is where the business
event that justifies it happens.

Reading a session the user is not a party to answers `404`, the same as a
session that does not exist. That is deliberate: a different answer would let a
handset enumerate your workspace one id at a time.

The WebSocket event stream refuses device tokens outright. It fans out a whole
workspace's events and narrowing it to one user is not built yet, so there is
no scope to ask for.

## Lifetime and revocation

Fifteen minutes, with a floor of one. `ttlSeconds` outside that window is
clamped rather than refused, so you will not meet the ceiling for the first
time in production.

Device tokens answer to the same revocation as every other token on your
workspace. Suspending the workspace stops them, and so does rotating your API
key, on the next request either way. There is no separate revocation list to
maintain.

## Migrating

Nothing breaks today. The `apiKey` and `apiSecret` form still works in 0.3.0
and is deprecated.

1. Add the endpoint to your backend and have it return a token to your app.
2. Move your app to `tokenProvider`. The rest of the SDK is unchanged.
3. Rotate your API key, because the old one has been inside a shipped app.

Until step 2 is done, use a **sandbox** key in builds you distribute. A sandbox
key only ever mints sandbox tokens, so extracting it is a nuisance rather than
a breach. The SDKs log a warning at runtime if the key starts with `rk_live_`.
