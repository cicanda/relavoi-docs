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

## Admonitions render as literal `:::note` text on most pages

Found on 6 November 2026 while rewriting the call-flow and failover guides.

27 of the 29 pages that use an admonition emit the directive into the HTML as
ordinary paragraph text, so a reader sees a line reading

```
:::info Supported numbers
```

followed by the body and a line reading `:::`, instead of a styled callout.
This is live on docs.relavoi.com now. It is not new and it is not caused by
anything in that rewrite; the two pages rewritten that day were converted to
plain markdown so they render correctly, which is why they are not in the
count.

It matters more than cosmetics. The callouts are where the honest
qualifications live: "Supported numbers", "recordingEnabled and consentPrompt",
"maxDurationMinutes is server-controlled", "Not built yet". A reader skimming
sees punctuation noise exactly where the caveat was supposed to catch them.

What was established, so the next person does not repeat it:

- Admonitions render on exactly three pages, all under `api-reference`:
  `webhooks.md`, `devices.md`, `authentication.md`. Everything under `sdks/`
  and `guides/`, plus `introduction.md`, does not.
- Setting `markdown.format: 'mdx'` in `docusaurus.config.ts` changes the
  behaviour but does not fix it: with it, those same three pages gain
  `theme-admonition` markup and the other 24 stay literal. It was reverted
  rather than shipped, because a partial change to how every page is parsed is
  worse than a defect that is written down.
- Not the cause: hard-wrapped body lines (un-wrapping one made no difference),
  and the position of the admonition relative to the first code fence
  (`devices.md` and `authentication.md` both have fences first and still
  render).
- Every page is `.md`; there are no `.mdx` sources.

Worth an hour with a minimal reproduction: one new page with a single
`:::note`, built, and bisected against a page that works. Likely somewhere in
the remark/MDX pipeline or the per-plugin markdown options rather than in the
content.
