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
