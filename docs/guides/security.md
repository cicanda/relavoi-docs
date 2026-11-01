---
title: Security model
sidebar_label: Security
description: Encryption at rest and in transit, phone number handling, API key model, and NDPR compliance posture for Relavoi.
---

# Security model

This page is the canonical reference for how Relavoi protects credentials, phone numbers and tenant data.

## Encryption at rest

All sensitive fields are encrypted with **AES-256-GCM**:

- Phone numbers (`partyA`, `partyB`) in `sessions.party_a_phone_enc` / `party_b_phone_enc`

Key hierarchy:

```text
KMS Master Key (AWS KMS, region-locked)
    -> Tenant KEK (one per tenant, rotated annually)
        -> Per-record DEK (envelope-encrypted, stored alongside ciphertext)
```

The DEK is generated per record and discarded from memory after use. Plaintext phone numbers only ever exist in the Call Router process for the few milliseconds required to issue the dial command to the carrier.

Hash lookups use a separate **SHA-256 + per-tenant salt** column (`party_a_phone_hash`). This lets the routing layer match incoming callers without decrypting any session.

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

Logging policy is enforced by lint rules and a redaction layer in the logger:

- Any field matching `/\+\d{10,15}/` is masked to `+234XXXXX5678` (last four digits only)
- Database query logs use bound parameters, never inline string interpolation
- Crash reports and APM traces redact PII before transmission

If you spot a plaintext MSISDN in any Relavoi log or response, file a security bug at `security@relavoi.com`. That is a P0.

## API key and secret model

Tenants authenticate with an `apiKey` + `apiSecret` pair. The key is prefixed `rk_live_` and the secret `rs_` (for example `rk_live_dd38d52e...`, `rs_e028efcc...`).

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

For a copy of the NDPR DPA template or our SOC 2 Type II report, contact your account manager.

## Abuse prevention

- Per-tier rate limits on session creation (see [Rate limits](../api-reference/rate-limits))
- Hard ceilings on concurrent sessions per tenant
- Per-session max call duration default 60 minutes
- Anomaly detection on unusual call-volume patterns triggers a webhook to your security team
- Numbers reported for abuse are quarantined within 10 minutes
