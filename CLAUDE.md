# Relavoi documentation site

Public documentation for the Relavoi API and SDKs.

## Before any work in this repo

Before any work in this repo: git fetch origin, then check whether origin/main
has commits you don't have. If it does, list them (author, message, files
touched) in your report before building. Genesis makes UI changes between our
sessions. Never overwrite them: rebase your work onto origin/main, and where a
conflict touches their work, keep their version and re-apply our change on
top. Fetch again right before you push, in case something landed while you
worked. After a long gap between sessions, assume something has changed.

## After any push, check this repository's CI before pushing anything else

Push, then check the run. Not at the end of the session, not "it'll be fine":
before the next push to this repository.

```
gh run list --repo cicanda/relavoi-docs --branch main --limit 1
```

And at the end of a round, every repository at once:

```
relavoi-infra/scripts/ci-status.sh
```

It prints the latest default-branch result for all nine and exits non-zero if
any is failing, cancelled or still running. **Its output goes at the top of the
report. A report does not say "green" without it.**

This is a rule because it has been broken twice in one week, the same way both
times. relavoi-backend sat red on main for two days behind a lint error a
narrower local command did not catch, and the report said zero lint errors.
relavoi-infra's terraform-plan failed for a day while four commits were pushed
through it, because a plan-only role was missing a read; the run ended in an
AccessDenied nobody opened, and because Terraform could not refresh the bucket
the plan also proposed replacing the backups.

Both were one command away. The reason neither got run is that the work felt
finished, and a push feels like the end of it. It is not: the push is where
the check starts.

An in-progress run is not a pass. Wait for it.

## Commit identity

Author and commit as `admin@cicanda.com`.

It is set per repository, `git config user.email admin@cicanda.com`, and not
globally. The global identity is a personal address, and before this was
pinned three different author identities had already reached this history:
`Kalu Chinecherem <kaluchinecherem8@gmail.com>`,
`Chinecherem Kalu <nechecodes@gmail.com>` and
`Kalu Chinecherem <nechecodes@gmail.com>`. Leave `user.name` as it is and
change only the address. Existing history is not rewritten.

Never add a Claude attribution line, a co-author trailer or a generated-by
note to a commit message or a pull request description. Never add
`Co-Authored-By`, `Generated with` or any other Claude or Anthropic
attribution to a commit or a PR.

The check, anchored because a trailer is always at the start of its own line
and because a prose mention of the forbidden string is not itself a violation:

```
git log --all --format=%B | grep -icE '^(co-authored-by|generated with)'
```

It answers 0 as of 2 November 2026, across every ref of every Relavoi repo,
and no author or committer has ever been Claude or Anthropic.

## SDK code samples are compiled

Every ```swift, ```kotlin and ```dart fence under `docs/sdks/` and in
`docs/guides/sdk-tokens.md` is compiled against the SDK at its newest released
tag. `.github/workflows/sdk-samples.yml` does it weekly, and on any pull
request that touches those pages.

The compiler cannot tell a copy-pasteable sample from a reference listing, so
the fence says which it is, in the info string after the language:

| Mark | Meaning |
|---|---|
| (none) | A complete sample. Must compile on its own. |
| `fragment` | A few statements out of a larger file. Compiled inside a generated wrapper. |
| `reference` | A listing of API the SDK provides, so a reader can see the shape. Not compiled; checked instead against the SDK source, name by name and field by field. |
| `manifest` | An excerpt of a build file: `Package.swift`, `build.gradle.kts`, `pubspec.yaml`. Not compiled. |
| `no-compile <reason>` | Last resort. The reason is required and gets printed. |

```dart fragment
await Relavoi.instance.sessions.end(session.id);
```

Two things follow for anyone editing these pages.

**An unannotated fence must compile.** Adding a Swift, Kotlin or Dart sample
without a mark commits it to compiling, which is the point. If it is a snippet,
mark it `fragment`.

**Do not drop a mark while editing prose around it.** Removing `reference` from
a listing of our own types turns it into a redeclaration of the SDK and fails;
removing `fragment` from two statements fails for want of a declaration.

The marks do not render: Docusaurus takes the language and ignores the rest of
the info string, and so does GitHub. The full rules live with each checker, in
`scripts/doc-samples/README.md` in each SDK repository.

A sample may use a symbol the SDK does not provide, like `myBackend` or a
`showAlert`. Each checker declares those once, in its prelude; if a new sample
invents a name, the check will say so and the name needs adding there. Keep
that deliberate: a name in the prelude is a name the reader has to supply.
