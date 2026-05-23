---
title: Introduction to Relavoi
sidebar_label: Introduction
description: Relavoi is a B2B phone-masking SaaS purpose-built for the Nigerian market, covering voice and SMS privacy on top of CPaaS providers.
---

# Introduction to Relavoi

Relavoi is a B2B SaaS platform that provides phone number masking as a service for the Nigerian market. We sit between your business apps and the telephony layer, so your couriers, riders, agents, and customers can talk to each other without ever exposing personal phone numbers.

Unlike consumer privacy apps (Burner, Hushed) which target individual users, Relavoi is API-first and built for operations teams shipping production workloads: ride-hailing dispatch, last-mile delivery, marketplace transactions, healthcare scheduling, and logistics tracking. There is currently no dedicated number-masking provider operating in the Nigerian market, which is why Bolt and Uber connect riders and drivers using raw MSISDNs today. Relavoi closes that gap.

## What you get

- A REST API for creating and managing masking sessions
- iOS (Swift) and Android (Kotlin) SDKs for in-app integration
- Push notifications branded for your tenant
- Real-time call verification banners
- Webhook delivery for every session and call event
- Built-in NDPR-compliant call recording with consent prompts
- Multi-CPaaS failover (Africa's Talking primary, Twilio backup)

## Five-layer architecture

```text
+--------------------------------------+
| Layer 1: Client Applications         |   Your mobile and web apps. Triggers
| (your rider app, dispatch console)   |   sessions when an order is assigned.
+--------------------------------------+
                |
                v
+--------------------------------------+
| Layer 2: Relavoi SDK                 |   Embedded in your app. Handles auth,
| (Kotlin / Swift)                     |   call verification, push tokens.
+--------------------------------------+
                |
                v
+--------------------------------------+
| Layer 3: Relavoi Platform            |   Session Manager, Number Pool,
| (API gateway, routing, webhooks)     |   Call Router, Webhook Handler.
+--------------------------------------+
                |
                v
+--------------------------------------+
| Layer 4: CPaaS Provider              |   Africa's Talking (primary) or
| (telephony infrastructure)           |   Twilio (failover) terminates calls.
+--------------------------------------+
                |
                v
+--------------------------------------+
| Layer 5: Telco Infrastructure        |   MTN, Airtel, Glo, 9mobile — the
| (Nigerian PSTN + mobile networks)    |   end user just answers their phone.
+--------------------------------------+
```

### Layer 1 — Client Applications

Your existing mobile and web products. You decide when to start a masking session (typically the moment an order is created or an agent is assigned) and when to end it.

### Layer 2 — Relavoi SDK

A lightweight Kotlin or Swift library. It handles short-lived JWT refresh, listens for active calls on the device, displays branded verification banners, and forwards push tokens to our backend.

### Layer 3 — Relavoi Platform

The control plane. Allocates proxy numbers atomically, routes calls in under 500 ms p99, deduplicates CPaaS webhooks, and fans out events to your registered webhooks.

### Layer 4 — CPaaS Provider

We multiplex over Africa's Talking for Nigerian voice and SMS because their pricing and PSTN routing are best-in-region. Twilio is on standby for failover at roughly 20% of primary pool capacity.

### Layer 5 — Telco Infrastructure

The user never installs anything weird. The proxy number is a real Nigerian MSISDN, so calls ring the same way they always do on MTN, Airtel, Glo, and 9mobile.

## Use cases

- **Ride-hailing**: connect drivers and passengers without leaking either side's number.
- **Delivery**: keep courier and customer phones private throughout the drop-off window.
- **E-commerce marketplaces**: let buyers and sellers coordinate pickup without long-term contact persistence.
- **Healthcare**: telemedicine follow-ups and pharmacy callbacks that respect patient privacy.
- **Logistics**: dispatchers and consignees coordinate shipments via a proxy that auto-expires on delivery.

## Pricing tiers

| Tier | Concurrent sessions | Requests / minute |
|------|---------------------|-------------------|
| STARTER | 100 | 100 |
| GROWTH | 1,000 | 500 |
| ENTERPRISE | 10,000 | 2,000 |

See [Rate Limits](./api-reference/rate-limits) for the full 429 contract and Retry-After semantics.

:::tip Where to next
New to Relavoi? Start at [Sign up](./getting-started/signup), then run through [Your first session](./getting-started/first-session).
:::
