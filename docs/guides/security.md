---
title: Security model
sidebar_label: Security
description: What Relavoi guarantees about your users' phone numbers, encryption at rest and in transit, the API key model, and our honest NDPR position.
---

# Security model

This page is the canonical statement of what Relavoi guarantees about
credentials, phone numbers and workspace data. It describes the guarantees
rather than the machinery behind them, and it is explicit about what we do not
have yet.

## Phone numbers

Four guarantees, in the order they matter to your users.

**A number is encrypted at rest.** Both parties' numbers are stored only as
**AES-256-GCM** ciphertext, under a key derived for your workspace alone.
Nobody's key opens another workspace's records, and a key can be replaced
without downtime and without making older records unreadable.

**We never hand a number back.** Not to your app, not to your dashboard, not
to the other party. Reading a session returns the **last four digits** of each
party and nothing more, so a seller can tell one order from another, and no
response from this API has ever carried a number anyone could dial.

**A number is never written to a log in plaintext.** Not in a request line,
not in a query string, not in an error. A plaintext number found in any
Relavoi log or response is a P0 incident, not a tidy-up.

**A number is decrypted only when the number itself is needed.** That is the
request in which you create the session, the instant of dialling, when we have
to tell the network where to ring, and a change of a session's second party,
where we compare against both existing parties so that nobody can be bridged
to themselves. It is never decrypted to search, to report, to bill or to
display. Replacing an encryption key and checking that a backup still opens
read it too, and both are audited operator actions rather than part of serving
your traffic.

Matching an incoming caller to their session does not require the number
itself. We match on an irreversible pseudonym, and because it is derived with
a secret only the platform holds, somebody who obtained the stored values
could not test a guessed number against them.

If you spot a plaintext MSISDN in any Relavoi log or response, file a security
bug at `security@relavoi.com`. That is a P0.

## Encryption in transit

- **External**: TLS from Let's Encrypt, terminated at the edge, with HSTS
  `max-age=63072000; includeSubDomains` on every host. Not preloaded: that is a
  submission to a browser list which is slow to undo.
- **Internal**: the database and cache have no route off the host at all,
  inbound or outbound. Nothing reaches them from the internet.
- **WebSocket**: WSS, with the JWT presented on the handshake. Device tokens
  are refused on this path.

Carrier callbacks arrive at Relavoi over the public internet and securing them
is our responsibility, not yours. Nothing you build touches that path. The
webhooks **we** send **you** are a different thing, and you do verify those:
see [Webhook integration](./webhook-integration).

## API key and secret model

Tenants authenticate with an `apiKey` + `apiSecret` pair. Both carry the mode
they belong to, so a sandbox credential can never be mistaken for a live one:
`rk_test_` / `rs_test_` while you are building, `rk_live_` / `rs_live_` once
your workspace is verified (for example `rk_live_dd38d52e...`,
`rs_live_e028efcc...`).

- Both values are stored only as one-way hashes. Neither is recoverable by us,
  so neither can be read back out of a support request or a breach.
- Rotation via `POST /v1/auth/rotate-key` (OWNER only) issues a new pair and
  immediately invalidates the old.
- The credentials never appear in dashboard URLs, logs, or webhook payloads.

SDKs trade the key and secret for a short-lived **JWT (15 min TTL)** at startup
and refresh transparently. The JWT carries `tenantId` and `tier`. Tenant-user
(dashboard) JWTs carry a different `type` discriminator, and operator tokens a
third, so none of them is accepted where another belongs.

### Device tokens

A key and secret must not ship inside a mobile app: anything compiled into one
can be read back out of it. `POST /v1/auth/sdk-token`, called from your own
backend, mints a token for **one user** carrying only the scopes you ask for,
for fifteen minutes.

- The subject identifies the user without being their number, and cannot be
  turned back into one.
- A route accepts a device token only if it has opted in by name, so the
  default for everything is refusal.
- Reading a session the user is not a party to answers `404`, the same as one
  that does not exist, so a handset cannot enumerate a workspace.
- They answer to the same revocation as any other token: suspension, and key
  rotation.

See [SDK tokens](./sdk-tokens).

## NDPR compliance

Relavoi is built around the Nigeria Data Protection Regulation 2019 (and the
NDPA 2023). Where we fall short of it, this list says so.

- **Data minimization**: numbers are encrypted at rest, matched without being
  decrypted, and never logged.
- **Retention limits**: 90 days after a session ends, we remove the personal
  data it held: both parties' numbers, the values we match them by, the last
  four digits and the metadata you attached. What stays is the part with no
  person in it, which billing and tax need: times, duration, status, cost and
  the provider's own call ids. Device tokens go 60 days after they were last
  refreshed. See [What deletion does not reach](#what-deletion-does-not-reach).
- **Right to erasure**: no self-service deletion endpoint exists yet. Ask us
  and we will remove a tenant's session and call data by hand.
- **Breach notification**: reports go to `security@relavoi.com`. No contractual
  notification window is in place yet.
- **Data Processing Agreements**: not yet signed with the telephony provider.
  In progress.

### What deletion does not reach

Removing a record from the database does not remove it from our backups, and
we would rather say so than let you assume otherwise.

| Copy | Kept for |
|---|---|
| Nightly database dumps | 90 days |
| Machine snapshots | about 28 days |

So a record deleted today can still exist in a backup for **up to 90 days
afterwards**, and for the first 30 of those the dumps are under a lock that
stops even us deleting them early. That lock is there to stop an attacker
destroying our backups, and the cost of having it is this.

Backups are encrypted at rest, are not readable by the running platform, which
can write them and nothing else, and are only ever opened by a person
restoring one. After 90 days every copy has expired on its own.

We hold no SOC 2 report and no ISO certification. This page once offered a SOC
2 Type II report that does not exist. If your procurement process needs one,
tell us and we will tell you honestly where we are.

## Abuse prevention

- Per-tier rate limits on session creation (see [Rate limits](../api-reference/rate-limits))
- Hard ceilings on concurrent sessions per tenant, and on concurrent sessions
  for one person, both set by tier
- A session has a hard maximum duration, 120 minutes by default, after which it
  expires whether or not your app ended it
- A number can be quarantined, which takes it out of the pool and replaces it.
  An operator does that by hand after a report; there is no time commitment
  on it

There is no anomaly detection. This page claimed unusual call-volume patterns
triggered a webhook to your security team, and nothing of the kind exists.
