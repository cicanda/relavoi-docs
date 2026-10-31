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
note to a commit message or a pull request description.
