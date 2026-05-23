---
title: Security model
sidebar_label: Security
description: Encryption at rest and in transit, phone number handling, API key model, and NDPR compliance posture for Relavoi.
---

# Security model

This page is the canonical reference for how Relavoi protects credentials, phone numbers, recordings, and tenant data.

## Encryption at rest

All sensitive fields are encrypted with **AES-256-GCM**:

- Phone numbers (`partyA`, `partyB`) in `sessions.party_a_phone_enc` / `party_b_phone_enc`
- SMS bodies in `sms_records.body_enc`
- Call recordings in object storage

Key hierarchy:

```text
KMS Master Key (AWS KMS, region-locked)
    -> Tenant KEK (one per tenant, rotated annually)
        -> Per-record DEK (envelope-encrypted, stored alongside ciphertext)
```

The DEK is generated per record and discarded from memory after use. Plaintext phone numbers only ever exist in the Call Router process for the few milliseconds required to issue the dial command to the CPaaS.

Hash lookups use a separate **SHA-256 + per-tenant salt** column (`party_a_phone_hash`). This lets the routing layer match incoming callers without decrypting any session.

## Encryption in transit

- **External**: TLS 1.3 only. TLS 1.2 was deprecated in 2025. HSTS preload with `max-age=31536000; includeSubDomains; preload`.
- **Internal**: mTLS between every Kubernetes service. Certificates rotated every 24 hours via cert-manager + SPIFFE identities.
- **WebSocket**: WSS with the same TLS 1.3 ciphers; JWT presented on handshake.

## Phone numbers never logged in plaintext

Logging policy is enforced by lint rules and a redaction layer in the logger:

- Any field matching `/\+\d{10,15}/` is masked to `+234XXXXX5678` (last four digits only)
- Database query logs use bound parameters, never inline string interpolation
- Crash reports and APM traces redact PII before transmission

If you spot a plaintext MSISDN in any Relavoi log or response, file a security bug at `security@relavoi.com` — that is a P0.

## API key and secret model

Tenants authenticate with an `apiKey` + `apiSecret` pair.

- `apiKey` is a SHA-256 hash stored in `tenants.api_key_hash`
- `apiSecret` is a bcrypt hash (cost factor 12) stored in `tenants.api_secret_hash`
- Neither value is recoverable. Rotation via `POST /v1/auth/rotate-key` issues a new pair and immediately invalidates the old.

The credentials never appear in dashboard URLs, logs, or webhook payloads.

SDKs trade the key+secret for a short-lived **JWT (15 min TTL)** at startup and refresh transparently. The JWT carries `tenantId`, `tier`, and `scopes`. Tenant-user (dashboard) JWTs carry a different `typ` discriminator so they cannot be used against SDK endpoints.

## NDPR compliance

Relavoi is built around the Nigeria Data Protection Regulation 2019 (and the NDPA 2023):

- **Consent for recording**: enforced at API layer (see [Call recording](./call-recording))
- **Data minimization**: phone numbers encrypted at rest, hashed for lookup, never logged
- **Retention limits**: default 90 days for call data, configurable down to 30
- **Breach notification**: 72-hour notification SLA via `security@relavoi.com`
- **Data Processing Agreements** with both Africa's Talking and Twilio cover sub-processor obligations
- **Right to erasure**: tenant-initiated deletion endpoint scrubs all session, call, and recording data within 30 days

For a copy of the NDPR DPA template or our SOC 2 Type II report, contact your account manager.

## Abuse prevention

- Per-tier rate limits on session creation (see [Rate limits](../api-reference/rate-limits))
- Hard ceilings on concurrent sessions per tenant
- Per-session max call duration default 60 minutes
- Anomaly detection on unusual call-volume patterns triggers a webhook to your security team
- Numbers reported for abuse are quarantined within 10 minutes
