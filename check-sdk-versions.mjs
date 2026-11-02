#!/usr/bin/env node
/**
 * Fail if an SDK install page names a version other than the newest tag on the
 * public repository it tells the reader to install from.
 *
 * These three pages were, until 2 November 2026, telling people to install an
 * organisation that is not ours at a version that was never published. The
 * version half of that can come back on its own, quietly, every time an SDK is
 * released: nothing here changes, the tag moves on, and the page keeps naming
 * the old one. So this asks GitHub what the newest tag is and compares.
 *
 *   node check-sdk-versions.mjs
 *
 * It reads public tag lists only, so it needs no credential. A rate limit or a
 * network failure is a skip rather than a failure, because a runner without
 * egress should not turn this red.
 */
import { readFileSync } from "node:fs";

const ORG = "cicanda";

/** Each page, the repo it installs from, and how a version appears on it. */
const PAGES = [
  {
    platform: "ios",
    repo: "relavoi-ios-sdk",
    file: "docs/sdks/ios/installation.md",
    // SPM strips the leading v: the tag is vX.Y.Z, the page says X.Y.Z.
    strip: (tag) => tag.replace(/^v/, ""),
    find: (src) => [
      ...src.matchAll(/from: "([0-9]+\.[0-9]+\.[0-9]+)"/g),
      ...src.matchAll(/\*\*Up to Next Major\*\* from `([0-9]+\.[0-9]+\.[0-9]+)`/g),
    ].map((m) => m[1]),
  },
  {
    platform: "android",
    repo: "relavoi-android-sdk",
    file: "docs/sdks/android/installation.md",
    // JitPack names the artifact after the tag, leading v and all.
    strip: (tag) => tag,
    find: (src) =>
      [...src.matchAll(/com\.github\.cicanda:relavoi-android-sdk:(v[0-9][^"']*)/g)].map((m) => m[1]),
  },
  {
    platform: "flutter",
    repo: "relavoi-flutter-sdk",
    file: "docs/sdks/flutter/installation.md",
    strip: (tag) => tag,
    find: (src) => [...src.matchAll(/ref: (v[0-9][^\s]*)/g)].map((m) => m[1]),
  },
];

async function newestTag(repo) {
  const res = await fetch(`https://api.github.com/repos/${ORG}/${repo}/tags?per_page=100`, {
    headers: { accept: "application/vnd.github+json", "user-agent": "relavoi-docs-version-check" },
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const tags = (await res.json()).map((t) => t.name).filter((n) => /^v\d+\.\d+\.\d+$/.test(n));
  if (tags.length === 0) throw new Error("no vX.Y.Z tags");
  // Newest by version, not by the order the API happens to return.
  tags.sort((a, b) => {
    const pa = a.slice(1).split(".").map(Number);
    const pb = b.slice(1).split(".").map(Number);
    return pb[0] - pa[0] || pb[1] - pa[1] || pb[2] - pa[2];
  });
  return tags[0];
}

let failed = false;
let skipped = 0;

for (const page of PAGES) {
  const src = readFileSync(new URL(page.file, import.meta.url), "utf8");
  const found = [...new Set(page.find(src))];

  if (found.length === 0) {
    console.error(
      `FAIL  ${page.platform.padEnd(8)} ${page.file} has no version to check. ` +
        `If the install snippet changed shape, update this script rather than deleting the check.`,
    );
    failed = true;
    continue;
  }

  let tag;
  try {
    tag = await newestTag(page.repo);
  } catch (err) {
    console.log(`skip  ${page.platform.padEnd(8)} could not read tags for ${page.repo}: ${err.message}`);
    skipped += 1;
    continue;
  }

  const want = page.strip(tag);
  const wrong = found.filter((v) => v !== want);
  if (wrong.length > 0) {
    console.error(
      `FAIL  ${page.platform.padEnd(8)} ${page.file} names ${wrong.join(", ")}; ` +
        `${ORG}/${page.repo} is at ${tag}, so it should name ${want}`,
    );
    failed = true;
  } else {
    console.log(`ok    ${page.platform.padEnd(8)} ${page.file} names ${want}, the newest tag`);
  }
}

if (failed) {
  console.error("\nAn install page points at a version nobody should install. Fix the page.");
  process.exit(1);
}
if (skipped > 0) console.log(`\n${skipped} skipped (no GitHub access from here).`);
