---
title: Introduction to Relavoi
sidebar_label: Introduction
description: Relavoi is a B2B phone-masking SaaS purpose-built for the Nigerian market, keeping personal numbers private across the Nigerian telephony network.
---

# Introduction to Relavoi

Relavoi is a B2B SaaS platform that provides phone number masking as a service for the Nigerian market. We sit between your business apps and the telephony layer, so your couriers, riders, agents, and customers can talk to each other without ever exposing personal phone numbers.

Unlike consumer privacy apps (Burner, Hushed) which target individual users, Relavoi is API-first and built for operations teams shipping production workloads: ride-hailing dispatch, last-mile delivery, marketplace transactions, healthcare scheduling, and logistics tracking. There is currently no dedicated number-masking provider operating in the Nigerian market, which is why Bolt and Uber connect riders and drivers using raw MSISDNs today. Relavoi closes that gap.

## What you get

- A REST API for creating and managing masking sessions
- iOS (Swift), Android (Kotlin) and Flutter (Dart) SDKs for in-app integration
- Real-time call verification, so your customer can tell a genuine call from a
  spoofed one
- Webhook delivery for every session and call event, HMAC-signed
- WebSocket event streaming for live dashboards
- Usage metering against your plan's included minutes

Sessions connect Nigerian mobile numbers, and both parties must be in the same
country. Session length is configurable up to 24 hours, with a default cap of
120 minutes and a default grace period of 15.

## Not built yet

Three things appear in the data model, and in some cases in an API field, but
are not available to use. They are listed here once rather than labelled across
the reference:

- **SMS masking.** `POST /v1/sessions` accepts a session you could text
  through, but no message has ever been sent through the platform and the
  endpoint is not documented.
- **Call recording with a consent prompt.** `recordingEnabled` is a real field
  on a session and on your tenant config. Setting it to `true` is refused with
  `feature-not-available`. The consent announcement, retention and deletion
  path, encrypted storage and the carrier agreement all have to exist first.
- **Push notifications before a call.** The SDKs register device tokens today,
  which is the half that works. Nothing sends a notification yet.

Automatic failover between carriers is also not live: the circuit breaker is
real and monitors health, but there is no secondary pool to fail over to. See
[Failover](./guides/failover).

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
| (Kotlin / Swift / Dart)              |   call verification, device tokens.
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
| Layer 4: Telephony Provider          |   A licensed telephony layer
| (telephony infrastructure)           |   terminates the calls.
+--------------------------------------+
                |
                v
+--------------------------------------+
| Layer 5: Telco Infrastructure        |   Nigerian mobile networks: the
| (Nigerian PSTN + mobile networks)    |   end user just answers their phone.
+--------------------------------------+
```

### Layer 1: Client Applications

Your existing mobile and web products. You decide when to start a masking session (typically the moment an order is created or an agent is assigned) and when to end it.

### Layer 2: Relavoi SDK

A lightweight Kotlin, Swift or Dart library. It handles short-lived JWT refresh, listens for active calls on the device, displays branded verification banners, and registers device tokens with our backend.

### Layer 3: Relavoi Platform

The control plane. Allocates proxy numbers atomically, routes calls in under 500 ms p99, deduplicates telephony webhooks, and fans out events to your registered webhooks.

### Layer 4: Telephony Provider

We route Nigerian voice over a licensed telephony provider optimized for in-region pricing and PSTN routing. Its health is monitored by a circuit breaker; a second provider to fail over to is on the roadmap rather than in place.

### Layer 5: Telco Infrastructure

The user never installs anything weird. The proxy number is a real Nigerian MSISDN, so calls ring the same way they always do on the national mobile networks.

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
