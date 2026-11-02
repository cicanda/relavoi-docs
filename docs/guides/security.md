---
title: Security model
sidebar_label: Security
description: Encryption at rest and in transit, phone number handling, API key model, and NDPR compliance posture for Relavoi.
---

# Security model

This page is the canonical reference for how Relavoi protects credentials, phone numbers and tenant data.

## Encryption at rest

Phone numbers are encrypted with **AES-256-GCM**, in
`sessions.party_a_phone_enc` and `party_b_phone_enc`. They are the only
encrypted fields: everything else a session holds is routing metadata.

How the key is reached:

```text
Key material, held in AWS Secrets Manager and read at boot
    -> Per-tenant key: PBKDF2-SHA256(material, tenant id, 100,000 iterations)
        -> AES-256-GCM, with the key's id written into the ciphertext
```

Keys are versioned in a ring, and a ciphertext names the key that wrote it, so
a key can be replaced without downtime and old records stay readable. Derived
keys are memoised per tenant, because deriving one per call would put 100,000
PBKDF2 iterations on the routing path.

There is no KMS-managed master key, no per-record data key and no envelope
encryption, and no key has been rotated on a schedule. This page described all
three for months; none of it was ever built.

A number exists in plaintext in two places: the request that creates the
session, and the routing path at the moment of dialling, where the Call Router
decrypts it to tell the carrier where to connect the call.

### The lookup hashes are not a privacy control

`party_a_phone_hash` and `party_b_phone_hash` are **HMAC-SHA256 keyed by the
tenant id**. They let the routing layer match an incoming caller without
decrypting anything, which is their purpose, and they keep numbers out of
indexes and logs.

They are not secret-keyed. A tenant id appears in API responses, dashboard URLs
and JWT claims, so anyone holding both a tenant id and this column can test
candidate numbers against it, and the Nigerian mobile range is small enough to
walk. Treat these columns as pseudonyms, not as protection. Replacing them with
a hash keyed by a separate secret is on our list; the blind hash used elsewhere
in the platform already works that way.

## Encryption in transit

- **External**: TLS from Let's Encrypt, terminated at the edge, with HSTS
  `max-age=63072000; includeSubDomains` on every host. Not preloaded: that is a
  submission to a browser list which is slow to undo.
- **Internal**: the database and cache sit on a Docker network with no gateway,
  so neither has a route off the host: not to the internet, not to the instance
  metadata service. The API reaches them by service name and nothing reaches
  them from outside.
- **WebSocket**: WSS, with the JWT presented on the handshake. Device tokens
  are refused on this path.

## Phone numbers never logged in plaintext

The logger redacts by field name. Every field a number travels in is on an
explicit list (`agentPhone`, `customerPhone`, `userPhone`, `callerNumber`,
`destinationNumber`, the `party_*_phone*` columns and the carrier's own
spellings), and a redacted value is replaced with `[REDACTED]` rather than
partially masked.

- Database queries use bound parameters, so a number never reaches a query log
  by string interpolation
- Carrier callback paths carry a secret token, so the request log masks the
  path and drops the query string
- There is no APM or crash reporter in the stack, so there is no third party
  for a number to be redacted before reaching

The list is a list: a new field carrying a number has to be added to it. No
lint rule enforces that, which this page used to claim. Review of anything
that logs a request body is the control, and a plaintext number in a log is a
P0.

If you spot a plaintext MSISDN in any Relavoi log or response, file a security bug at `security@relavoi.com`. That is a P0.

## API key and secret model

Tenants authenticate with an `apiKey` + `apiSecret` pair. Both carry the mode
they belong to, so a sandbox credential can never be mistaken for a live one:
`rk_test_` / `rs_test_` while you are building, `rk_live_` / `rs_live_` once
your workspace is verified (for example `rk_live_dd38d52e...`,
`rs_live_e028efcc...`).

- `apiKey` is a SHA-256 hash stored in `tenants.api_key_hash`
- `apiSecret` is a bcrypt hash (cost factor 12) stored in `tenants.api_secret_hash`
- Neither value is recoverable. Rotation via `POST /v1/auth/rotate-key` (OWNER only) issues a new pair and immediately invalidates the old.

The credentials never appear in dashboard URLs, logs, or webhook payloads.

SDKs trade the key and secret for a short-lived **JWT (15 min TTL)** at startup
and refresh transparently. The JWT carries `tenantId` and `tier`. Tenant-user
(dashboard) JWTs carry a different `type` discriminator, and operator tokens a
third, so none of them is accepted where another belongs.

### Device tokens

A key and secret must not ship inside a mobile app: anything compiled into one
can be read back out of it. `POST /v1/auth/sdk-token`, called from your own
backend, mints a token for **one user** carrying only the scopes you ask for,
for fifteen minutes.

- The subject is a hash of the number, never the number.
- A route accepts a device token only if it has opted in by name, so the
  default for everything is refusal.
- Reading a session the user is not a party to answers `404`, the same as one
  that does not exist, so a handset cannot enumerate a workspace.
- They answer to the same revocation as any other token: suspension, and key
  rotation.

See [SDK tokens](./sdk-tokens).

## NDPR compliance

Relavoi is built around the Nigeria Data Protection Regulation 2019 (and the NDPA 2023):

- **Data minimization**: phone numbers encrypted at rest, hashed for lookup, never logged
- **Retention limits**: 90 days is the intended default for call data. The
  deletion job that enforces it is not built yet, so today data stays until it
  is removed by hand on request.
- **Breach notification**: reports go to `security@relavoi.com`. No contractual
  notification window is in place yet.
- **Data Processing Agreements**: not yet signed with the telephony provider.
  In progress.
- **Right to erasure**: no self-service deletion endpoint exists yet. Ask us and we will remove a tenant's session and call data by hand

We hold no SOC 2 report and no ISO certification. This page offered a SOC 2
Type II report that does not exist. If your procurement process needs one, tell
us and we will tell you honestly where we are.

## Abuse prevention

- Per-tier rate limits on session creation (see [Rate limits](../api-reference/rate-limits))
- Hard ceilings on concurrent sessions per tenant, and on concurrent sessions
  for one person, both set by tier
- A session has a hard maximum duration, 120 minutes by default, after which it
  expires whether or not your app ended it
- A number can be quarantined, which takes it out of the pool and replaces it.
  An operator does that by hand after a report; there is no automatic detection
  and no time commitment on it

There is no anomaly detection. This page claimed unusual call-volume patterns
triggered a webhook to your security team, and nothing of the kind exists.
