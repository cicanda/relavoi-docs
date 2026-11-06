# Backlog

Work that was found, understood and deliberately not done, with enough detail
that picking it up does not mean rediscovering it. Dated entries, newest first.
Delete an entry when it ships; do not leave it here marked done.

## 2026-11-02

### 48 npm advisories in the Docusaurus build tree, 18 of them critical

Found while adding ESLint, and **not** caused by it: the one advisory that
would have come with eslint (minimatch, GHSA-g3hv-75wg-m249) is pinned out by
the `overrides` block in `package.json`.

`npm audit` reports 4 low, 12 moderate, 14 high and 18 critical. Every one of
them is build-time. The critical roots are `shell-quote` (command injection via
a line terminator), `proxy-addr` (IP spoofing), `websocket-driver` (message
corruption), and `tinypool` (prototype pollution to RCE); the rest chain from
`@docusaurus/core` through `@docusaurus/bundler` to `copy-webpack-plugin`,
plus `webpack-dev-server`, `postcss`, `svgo`, `js-yaml`, `browserslist`,
`@babel/core` and `fast-uri`.

What that means for exposure: Docusaurus emits static HTML and the deployed
artifact is a directory of files, so none of this code runs for a reader of
docs.relavoi.com. The reachable surface is our own build, and the three
dev-server advisories need `npm start` running, which CI never does. So this is
a real stack of advisories against a tool we run, not against the site we
serve.

The fix is a Docusaurus upgrade: this repo pins `3.10.1` exactly across
`@docusaurus/core`, `/faster`, `/preset-classic`, `/module-type-aliases`,
`/tsconfig` and `/types`. Picking it up means bumping all six together,
rebuilding, and checking the custom homepage in `src/pages/index.tsx` and the
design page still render, since both are hand-built rather than themed.

Not done now because it is a dependency upgrade of the whole site generator and
has nothing to do with introducing a linter.

## Resolved 2026-11-06: admonitions rendered as literal `:::note` text

**Cause: Docusaurus 3 moved to MDX 3, and MDX 3 requires the directive label
in square brackets.**

```
:::note[Title]      a callout titled "Title"
:::note             a callout titled "note"
:::note Title       NOT a directive. Falls through as a paragraph.
```

That last line is the Docusaurus 2 form. In MDX 3 the directive name must be
followed by an optional `[label]`, an optional `{attributes}`, or nothing, so a
bare word after the name stops the line matching the directive rule entirely.
Nothing warns, at any log level. The build succeeds, Vercel deploys, and the
reader gets a line of literal `:::note Title` where the callout should be.

Established by a three-case reproduction page: no title rendered, bracketed
title rendered, bare title did not. It explains every observation that looked
inconsistent before, including the page with two admonitions where one worked:
`api-reference/webhooks.md` had `:::danger` with no title, which rendered, and
`:::info Single webhook URL per tenant`, which did not. The three pages that
worked were the three whose admonitions had no title.

Also explains why `markdown.format: 'mdx'` appeared to "half fix" it. It
changed nothing about the directive rule; it only brought three pages into MDX
parsing whose admonitions were already in a form that works.

**Fixed:** 47 admonitions across 26 pages converted to the bracket form. The
built site now contains zero literal `:::` outside a code block, and 50
rendered callouts.

**Guarded:** `check-admonitions.js`, wired into CI as two steps. A source pass
before the build, which names the file, the line and the fix, and a built pass
after it, which fails on a literal `:::` in any built page outside a code
block. The second exists because the first only knows the six names Docusaurus
ships: a `::::`, a `:::Note` or a future syntax change would slip past it. Both
were confirmed to fail on the bug before being committed.

What this cost while it was live: the callouts are where the qualifications
sit. "Supported numbers", "Do not compile a live secret into the app",
"recordingEnabled and consentPrompt", "Save these now", "Reject stale
timestamps". A reader skimming met punctuation noise exactly where the warning
was meant to stop them.

