# Relavoi Documentation

The public docs site for [Relavoi](https://relavoi.com) — covers the platform overview, API reference, SDK guides for Android + iOS, integration guides, and the canonical design language reference.

Built with [Docusaurus 3](https://docusaurus.io/) (TypeScript template).

## Setup

```bash
npm install
npm start         # dev server with hot reload on http://localhost:3000
                  # NOTE: collides with relavoi-backend's :3000 — use:
                  # npm start -- --port 3010
```

## Build & serve a production bundle

```bash
npm run build     # generates ./build/
npx serve build   # quick preview
```

The build is a pure static site — drop it on any CDN.

## Content layout

```
docs/                       sidebar entries (see sidebars.ts)
  introduction.md
  getting-started/          signup, first-session, concepts
  guides/                   call-flow, sms-masking, call-recording (NDPR),
                            webhook-integration, failover, security
  api-reference/            authentication, sessions, calls, sms, numbers,
                            analytics, billing, webhooks, errors, rate-limits
  sdks/android/             installation, initialization, sessions,
                            call-verification, push-notifications, events, permissions
  sdks/ios/                 installation, initialization, sessions,
                            call-verification, push-notifications, events,
                            live-activities
src/
  pages/index.tsx           cover slide — ink-900 hero with brand mark
  pages/design.tsx          design-language style guide (tokens, type, state pills)
  css/custom.css            Relavoi brand colors + IBM Plex font loader
docusaurus.config.ts        3 sidebars: docs / API Reference / SDKs
sidebars.ts                 explicit file ordering
```

## Sidebars

Three sidebars in the top nav:

| Sidebar | Source |
|---|---|
| **Docs** | introduction + getting-started + guides |
| **API Reference** | all `/api-reference/*` pages |
| **SDKs** | Android + iOS guides |

## Design language reference

The `/design` page is the single source of truth for the design tokens, type scale, and state-pill semantics used by every Relavoi frontend. Link to it from PR descriptions and reviews so reviewers can compare against one canonical reference.

## CI / deploy

GitHub Actions (`.github/workflows/ci.yml`) runs `npm run build` on every PR. `deploy.yml` is a stub: push to `main` → Vercel auto-deploys via the Git integration. Wire up `VERCEL_TOKEN` + project IDs in repo secrets if you want CI-driven manual deploys.

## Related Repositories

- [relavoi-backend](https://github.com/cicanda/relavoi-backend) — API server
- [relavoi-dashboard](https://github.com/cicanda/relavoi-dashboard) — Tenant web dashboard
- [relavoi-admin](https://github.com/cicanda/relavoi-admin) — Operator console
- [relavoi-android-sdk](https://github.com/cicanda/relavoi-android-sdk) — Android SDK
- [relavoi-ios-sdk](https://github.com/cicanda/relavoi-ios-sdk) — iOS SDK
- [relavoi-infra](https://github.com/cicanda/relavoi-infra) — Terraform infrastructure
