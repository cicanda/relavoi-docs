---
title: OpenAPI and Postman
sidebar_label: OpenAPI & Postman
description: The machine-readable spec, a Postman collection and an environment file, all generated from one source.
---

# OpenAPI and Postman

Three files, all derived from one spec, all served from this site:

| File | What it is |
|---|---|
| [`openapi.yaml`](pathname:///openapi.yaml) | The spec. OpenAPI 3.1, the source of truth for this reference |
| [`openapi.json`](pathname:///openapi.json) | The same spec as JSON, for tooling without a YAML parser |
| [`relavoi.postman_collection.json`](pathname:///relavoi.postman_collection.json) | Every endpoint as a Postman request, grouped the way this reference is |
| [`relavoi.postman_environment.json`](pathname:///relavoi.postman_environment.json) | `baseUrl` and the token variables, all empty |

## Getting started in Postman

1. Import both JSON files. Postman will offer to set the environment active;
   do that, or pick **Relavoi production** from the environment selector.
2. Open **Authentication** and run *Exchange an API key and secret for an SDK
   token*, with your key and secret in the body.
3. Copy the `accessToken` from the response into the environment's
   `accessToken` variable.

Every other request inherits bearer auth from the collection and reads that
variable, so once it is set the whole collection works.

:::note The environment file holds no secrets
`accessToken`, `apiKey` and `apiSecret` ship empty and are typed as secrets, so
Postman masks whatever you paste. Nothing you put in them is saved back to this
site. Do not commit a filled-in copy to your own repository either: a token
lasts 15 minutes, but a key and secret last until you rotate them.
:::

## What the spec covers

The tenant-facing API: sessions, calls, numbers, webhooks, devices, analytics,
billing and verification. Deliberately absent, and why:

- **The operator console API** (`/v1/admin/**`). Not a customer surface.
- **Carrier callbacks** (`/v1/webhooks/cpaas/**`). These come *in*, from the
  telephony provider, and the path carries a secret token. Publishing the shape
  would publish where to aim at it.
- **The payment provider callback** (`/v1/webhooks/payments`). Also inbound.
- **SMS** (`/v1/sessions/{id}/sms`). SMS masking is not available; see
  [Not built yet](../introduction#not-built-yet).

## How it is kept honest

The spec is hand-written, because the API validates request bodies inside each
handler rather than with Fastify JSON schemas, so there is nothing for a
generator to read. A hand-written spec rots, so there is a test that stops it:
it builds the real server, reads its route table, and fails if the spec
describes an endpoint that does not exist **or** if the server has a
tenant-facing endpoint the spec does not describe. The exclusion list above is
the only way a route escapes, and each entry needs a reason.

The collection and the environment are generated from the spec by a script, and
a second test fails if the number of requests in the collection stops matching
the number of operations in the spec. So all four files move together or the
build goes red.
