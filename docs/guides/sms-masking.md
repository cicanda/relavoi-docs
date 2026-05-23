---
title: SMS masking
sidebar_label: SMS masking
description: How inbound and outbound SMS flow through the same session as voice, with AES-256-GCM encryption at rest and direction-mode enforcement.
---

# SMS masking

Every Relavoi session is dual-channel: the same proxy number that carries voice also relays SMS between the two parties. There is no separate "SMS session" object — if you have an ACTIVE voice session, SMS just works.

## How a message moves

```mermaid
sequenceDiagram
  participant Agent
  participant Telco as Nigerian PSTN
  participant AT as Africa's Talking
  participant WH as Webhook Handler
  participant Router as SMS Router
  participant Customer

  Agent->>Telco: SMS to +2348000000001
  Telco->>AT: deliver SMS
  AT->>WH: POST inbound_sms webhook
  WH->>Router: lookup(proxy, sender)
  Router->>Router: session matched, A_TO_B allowed
  Router->>AT: send SMS from +2348000000001 to customer
  AT->>Telco: deliver
  Telco->>Customer: SMS arrives
```

Replies follow the same path in reverse. Neither party ever sees the other's real MSISDN.

## Encryption at rest

Message bodies are encrypted with **AES-256-GCM** using a tenant-scoped Data Encryption Key (DEK) wrapped by your tenant's KMS-managed Key Encryption Key (KEK). The ciphertext, nonce, and auth tag are stored in `sms_records.body_enc`. Plaintext is only materialized in memory in the SMS Router for the few milliseconds between decryption and forwarding.

The same encryption envelope is used for phone numbers themselves — see [Security](./security) for the full crypto model.

## Direction mode enforcement

Direction modes you set at session create time apply to SMS exactly as they do to voice:

| directionMode | Agent -> Customer SMS | Customer -> Agent SMS |
|---------------|----------------------|----------------------|
| BIDIRECTIONAL | delivered | delivered |
| A_TO_B_ONLY | delivered | silently dropped, logged |
| B_TO_A_ONLY | silently dropped, logged | delivered |

Dropped messages are visible in `GET /v1/sessions/:id/sms` with `status: "BLOCKED_DIRECTION"`, so you can audit them.

## Reading message history

```bash
curl https://api.relavoi.com/v1/sessions/sess_a1b2c3d4/sms \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

See [SMS API reference](../api-reference/sms) for the full schema and filters.

:::note Outbound from your backend
Sending SMS from your backend directly to a customer (i.e. without an inbound trigger) is on the roadmap — see the SMS reference for status. For now, SMS is bidirectional within an active session only.
:::
