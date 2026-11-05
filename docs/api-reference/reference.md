---
title: Reference Lists API
sidebar_label: Reference lists
description: The industry and country lists your workspace profile is validated against, served so your own forms do not have to hold a copy.
---

# Reference Lists API

Two fixed lists: the industries a workspace can describe itself as, and the
countries a business can be registered in. The API validates `industry` and
`country` on your workspace against the same lists it serves here, so building
a form from this response means it cannot offer a value the save will refuse.

No auth. Nothing here is specific to your workspace.

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| GET | `/v1/reference` | The industry and country lists |

---

### GET /v1/reference

**Request**

```bash
curl https://api.relavoi.com/v1/reference
```

**Response**

```json
{
  "industries": [
    { "code": "RIDE_HAILING", "label": "Ride-hailing" },
    { "code": "DELIVERY", "label": "Delivery" },
    { "code": "ECOMMERCE", "label": "E-commerce" },
    { "code": "MARKETPLACE", "label": "Marketplace" },
    { "code": "LOGISTICS", "label": "Logistics" },
    { "code": "HEALTHCARE", "label": "Healthcare" },
    { "code": "OTHER", "label": "Other" }
  ],
  "countries": [
    { "code": "AF", "name": "Afghanistan" },
    { "code": "NG", "name": "Nigeria" },
    { "code": "GB", "name": "United Kingdom" }
  ]
}
```

`countries` is abbreviated above. The real response carries all 249 ISO 3166-1
alpha-2 codes, ordered by name, which is the order to render them in.

**Field reference**

| Field | Type | Description |
|-------|------|-------------|
| industries[].code | string | What you send as `industry`. Stored as the code |
| industries[].label | string | What to show a person |
| countries[].code | string | ISO 3166-1 alpha-2, upper case. What you send as `country` |
| countries[].name | string | The English name |

Sent with `Cache-Control: public, max-age=86400`. The lists are constant for
the lifetime of a deploy, so cache them.

---

## Why every country, when you only connect Nigeria

`country` on your workspace is where your business is registered. That is a
different question from where we can place a call, and the two should not share
a list: a company registered in the United Kingdom can run a Lagos delivery
fleet, and a dropdown offering it one option would have made it answer wrongly.

The countries whose numbers we can actually connect are a separate, much
shorter list, and today it is Nigeria alone. A session whose numbers are not
Nigerian mobile numbers is refused with
[`number-not-supported`](./errors.md), whatever your workspace's registered
country says.

Nothing in the platform reads `country`. It is there so we know who our
customers are.

## Industry codes

`OTHER` is always present, so a business is never forced to misdescribe itself
to get past the field. Both fields are optional and may be `null`.

A code is stable; a label is not. Store and send the code, and read the label
from this endpoint rather than writing it into your own code, so a label we
reword does not become a value you send.

For compatibility, `PATCH /v1/config` and `POST /v1/auth/signup` also accept a
display label (`"Delivery"`) or an obvious near-miss (`"ridehailing"`) for
`industry` and map it to its code. That exists because the field was free text
until November 2026. New integrations should send the code.

## Using them

```bash
# the lists
curl -s https://api.relavoi.com/v1/reference

# set your own
curl -X PATCH https://api.relavoi.com/v1/config \
  -H "Authorization: Bearer $RELAVOI_DASHBOARD_JWT" \
  -H "Content-Type: application/json" \
  -d '{"industry": "RIDE_HAILING", "country": "NG"}'
```

`country` is accepted in either case and stored upper case. A code that is not
in the list is a `400`.
