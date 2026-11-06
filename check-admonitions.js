#!/usr/bin/env node
/**
 * Admonitions must render as admonitions.
 *
 * Docusaurus 3 moved to MDX 3, and with it the directive label has to be in
 * square brackets:
 *
 *     :::note[Title]      renders a callout titled "Title"
 *     :::note             renders a callout titled "note"
 *     :::note Title       is NOT a directive, and falls through as a paragraph
 *
 * That last line is the Docusaurus 2 form. MDX 3 requires the name to be
 * followed by an optional [label], an optional {attributes}, or nothing at
 * all, so a bare word after the name stops it matching the directive rule.
 * Nothing warns. The build succeeds, the page deploys, and a reader sees a
 * line of literal ":::note Title" where the callout should be.
 *
 * On 6 November 2026 that was true of 47 admonitions across 26 pages, live on
 * docs.relavoi.com. It mattered more than cosmetics: the callouts are where
 * the qualifications live. "Supported numbers", "Do not compile a live secret
 * into the app", "recordingEnabled and consentPrompt", "Save these now". A
 * reader skimming met punctuation noise exactly where the warning was meant to
 * stop them, and the three that did render were the three with no title.
 *
 * Two passes, because they fail differently.
 *
 *   source  every `:::name` in docs/ is checked for the bracket form. This is
 *           the useful error: it names the file, the line and the fix.
 *   built   every page in build/ is checked for a literal ":::" outside a code
 *           block. This is the backstop, and it catches what the source pass
 *           cannot know about: a misspelled directive name, a `::::`, a
 *           `:::Note`, or a future syntax change that silently stops matching.
 *
 * Code blocks are exempt in the built pass, because a page documenting this
 * syntax has every right to print ":::note[Title]" inside a fence. The source
 * pass skips fenced regions for the same reason.
 *
 * Usage:
 *   node check-admonitions.js            both passes; built pass needs a build
 *   node check-admonitions.js --source   source only, no build required
 */

const fs = require('node:fs');
const path = require('node:path');

const DOCS = path.join(__dirname, 'docs');
const BUILD = path.join(__dirname, 'build');

// The set Docusaurus ships. A name outside it is not an admonition, so the
// source pass leaves it to the built pass rather than guessing.
const TYPES = new Set(['note', 'tip', 'info', 'caution', 'warning', 'danger']);

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

const problems = [];

// ─── Pass 1: the source ──────────────────────────────────────────────────────
let sourceFiles = 0;
let admonitions = 0;
for (const file of walk(DOCS, '.md')) {
  sourceFiles += 1;
  const rel = path.relative(__dirname, file);
  let inFence = false;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^:::(\w+)(.*)$/.exec(line);
    if (!m) continue;
    const [, name, rest] = m;
    if (!TYPES.has(name)) continue;
    admonitions += 1;
    const trimmed = rest.trim();
    if (trimmed === '' || trimmed.startsWith('[')) continue;
    problems.push(
      `${rel}:${i + 1}  :::${name} ${trimmed}\n` +
        `    This is the Docusaurus 2 form and renders as literal text.\n` +
        `    Write it as:  :::${name}[${trimmed}]`,
    );
  }
}

// ─── Pass 2: the built output ────────────────────────────────────────────────
let builtPages = 0;
let scannedBuild = false;
if (fs.existsSync(BUILD) && !process.argv.includes('--source')) {
  scannedBuild = true;
  for (const file of walk(BUILD, '.html')) {
    builtPages += 1;
    const rel = path.relative(__dirname, file);
    const html = fs.readFileSync(file, 'utf8');
    // Strip what is legitimately allowed to contain the characters.
    const prose = html
      .replace(/<pre[\s\S]*?<\/pre>/g, '')
      .replace(/<code[\s\S]*?<\/code>/g, '')
      .replace(/<script[\s\S]*?<\/script>/g, '');
    if (!prose.includes(':::')) continue;
    const near = prose.slice(Math.max(0, prose.indexOf(':::') - 60), prose.indexOf(':::') + 60);
    problems.push(
      `${rel}  built page contains a literal ":::" outside a code block\n` +
        `    ...${near.replace(/\s+/g, ' ').trim()}...\n` +
        `    An admonition did not render. Check its syntax in the source page.`,
    );
  }
}

if (problems.length) {
  console.error(`\nAdmonition check FAILED: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error('  ' + p + '\n');
  console.error('Docusaurus 3 needs the title in brackets: :::note[Title], not :::note Title.\n');
  process.exit(1);
}

console.log(
  `Admonitions OK. ${admonitions} in ${sourceFiles} source pages` +
    (scannedBuild ? `, no literal ":::" in ${builtPages} built pages.` : ' (source only).'),
);
