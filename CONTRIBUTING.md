# Contributing

## Branching

- `main` is always deployable.
- Work happens on short-lived branches: `feat/<name>`, `fix/<name>`, `chore/<name>`.
- Rebase or squash-merge into `main`; avoid long-lived divergent branches.

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

Common types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`. Enforced by commitlint on commit.

Bypass hooks only when necessary (e.g. WIP or fixup):

```bash
git commit --no-verify -m "wip: ..."
```

## Before opening a PR

```bash
npm run lint
npm run format:check
npm test --prefix backend
```

All three run in CI (Phase 9) but faster to catch locally. Hooks run `lint-staged` automatically on commit, so normal `git commit` / `git push` just works.

## Database changes

Schema changes go through Prisma migrations, not manual SQL:

```bash
cd backend
npx prisma migrate dev --name <description>
```

Commit the generated migration folder.
