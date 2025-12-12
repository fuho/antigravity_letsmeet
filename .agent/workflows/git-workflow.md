---
description: Unified Git workflow and branching strategy for LetsMeet development
---

# Unified Git Workflow

## Branch Structure

- `main` – Production‑ready releases only (deployed to Cloudflare Pages).
- `dev` – Integration branch where all feature, fix, and test branches are merged first.
- `feature/*` – New functionality (e.g., `feature/poi-search`).
- `fix/*` – Bug fixes (e.g., `feature/marker-position`).
- `test/*` – Adding or updating tests (e.g., `test/store-coverage`).

## Branch Naming Convention

- **Features**: `feature/descriptive-name`
- **Bug fixes**: `fix/descriptive-name`
- **Refactoring**: `refactor/descriptive-name`
- **Documentation**: `docs/descriptive-name`
- **Tests**: `test/descriptive-name`

## Development Workflow

### 1. Starting New Work

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

### 2. During Development

- Commit frequently using Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`).
- Run tests locally: `npm test`.
- Run lint: `npm run lint`.
- Keep the codebase building: `npm run build`.

### 3. Merging to Dev

```bash
git checkout dev
git pull origin dev
git merge feature/your-feature-name --no-edit
git push origin dev
```

### 4. Cleanup (optional)

```bash
git branch -d feature/your-feature-name
```

## Release Workflow (Dev → Main)

1. **Pre‑release Checks on `dev`**

```bash
npm run lint
npm test
npm run build
```

All must pass.
2. **Bump Version** – Update `package.json`, `src/version.ts`, and add a changelog entry.
3. **Commit Version Bump**

```bash
git add -A
git commit -m "chore: Bump version to X.Y.Z"
```

4. **Merge to `main` & Tag**

```bash
git checkout main
git pull origin main
git merge dev --no-edit
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

5. **Push to Production**

```bash
git push origin main --tags
```

6. **Sync `dev` with `main`**

```bash
git checkout dev
git merge main --no-edit
git push origin dev
```

## Version Numbering (Semantic)

- **Major** (x.0.0): Breaking changes or major new features.
- **Minor** (1.x.0): New features, backwards compatible.
- **Patch** (1.1.x): Bug fixes only.

## Pre‑commit Checklist

- [ ] Working in a feature branch (not `main`).
- [ ] Code tested locally.
- [ ] No TypeScript errors (`npm run build`).
- [ ] Commit messages follow Conventional Commits.
- [ ] `CHANGELOG.md` updated (for releases).

## Quick Reference

| Action | Command |
|--------|---------|
| Start feature | `git checkout dev && git checkout -b feature/name` |
| Merge to dev | `git checkout dev && git merge feature/name` |
| Release | Checks → bump → merge to main → tag → push |

---

## Remember

- Always branch from `dev`, never directly from `main`.
- Run full checks (lint, test, build) before any merge.
- Keep `CHANGELOG.md` up to date for releases.
